"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import {
  COMMON_FIELDS,
  SERVICES,
  TRAILING_FIELDS,
  getService,
  type Field,
  type FieldOption,
  type ServiceType,
} from "@/lib/request/config";
import { HONEYPOT_FIELD } from "@/lib/request/validate";

type Values = Record<string, string | string[]>;

export function RequestForm({
  initialService,
  varietyOptions,
}: {
  initialService?: ServiceType;
  varietyOptions: FieldOption[];
}) {
  const router = useRouter();
  const [serviceType, setServiceType] = useState<ServiceType | undefined>(initialService);
  const [values, setValues] = useState<Values>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const started = useRef(false);

  const service = serviceType ? getService(serviceType) : undefined;

  const optionsFor = useCallback(
    (field: Field): FieldOption[] => (field.optionsFrom === "varieties" ? varietyOptions : (field.options ?? [])),
    [varietyOptions],
  );

  const fields = useMemo<Field[]>(
    () => (service ? [...COMMON_FIELDS, ...service.fields, ...TRAILING_FIELDS] : []),
    [service],
  );

  const markStarted = useCallback(() => {
    if (started.current || !serviceType) return;
    started.current = true;
    trackEvent("form_start", { service: serviceType });
  }, [serviceType]);

  const setValue = (name: string, value: string | string[]) => {
    markStarted();
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMulti = (name: string, option: string) => {
    markStarted();
    setValues((prev) => {
      const current = Array.isArray(prev[name]) ? (prev[name] as string[]) : [];
      const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
      return { ...prev, [name]: next };
    });
  };

  // --- Service selector (shown when no ?service= and nothing picked) ----
  if (!service) {
    return (
      <div className="rm-cards">
        {SERVICES.map((s) => {
          const body = (
            <>
              <span className="rm-card-glyph" aria-hidden="true">
                {s.glyph}
              </span>
              <span className="rm-card-title">{s.label}</span>
              <span className="rm-card-desc">{s.tagline}</span>
              <span className="rm-card-cta">{s.enabled ? "Start a request →" : "Coming soon"}</span>
            </>
          );
          return s.enabled ? (
            <button
              key={s.type}
              type="button"
              className="rm-card"
              onClick={() => {
                setServiceType(s.type);
                setError(null);
              }}
            >
              {body}
            </button>
          ) : (
            <div key={s.type} className="rm-card" aria-disabled="true" style={{ opacity: 0.6 }}>
              {body}
            </div>
          );
        })}
      </div>
    );
  }

  const missingRequired = (): Field | null => {
    for (const f of fields) {
      if (!f.required) continue;
      const v = values[f.name];
      const empty = Array.isArray(v) ? v.length === 0 : !v || !v.trim();
      if (empty) return f;
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const missing = missingRequired();
    if (missing) {
      setError(`${missing.label} is required.`);
      trackEvent("form_error", { service: service.type, field: missing.name });
      return;
    }

    const payload: Values = {};
    for (const f of service.fields) {
      if (values[f.name] !== undefined) payload[f.name] = values[f.name];
    }

    const body = {
      serviceType: service.type,
      name: (values.name as string) ?? "",
      email: (values.email as string) ?? "",
      phone: (values.phone as string) ?? "",
      source: (values.source as string) ?? "",
      notes: (values.notes as string) ?? "",
      payload,
      [HONEYPOT_FIELD]: (values[HONEYPOT_FIELD] as string) ?? "",
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      trackEvent("form_complete", { service: service.type });
      router.push("/request/thank-you");
    } catch (err) {
      setSubmitting(false);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      trackEvent("form_error", { service: service.type });
    }
  };

  return (
    <form className="rm-form" onSubmit={onSubmit} noValidate>
      <p className="rm-service-switch">
        Requesting a quote for <strong>{service.label}</strong>.{" "}
        <Link
          href="/request"
          onClick={(e) => {
            e.preventDefault();
            setServiceType(undefined);
            setValues({});
            setError(null);
            started.current = false;
          }}
        >
          Choose a different service
        </Link>
      </p>

      {fields.map((f) => (
        <FieldControl
          key={f.name}
          field={f}
          value={values[f.name]}
          options={optionsFor(f)}
          onText={(v) => setValue(f.name, v)}
          onToggle={(opt) => toggleMulti(f.name, opt)}
        />
      ))}

      {/* Honeypot: hidden from humans, catnip for bots. */}
      <div className="rm-hp" aria-hidden="true">
        <label htmlFor="rm-company">Company (leave blank)</label>
        <input
          id="rm-company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={(values[HONEYPOT_FIELD] as string) ?? ""}
          onChange={(e) => setValues((p) => ({ ...p, [HONEYPOT_FIELD]: e.target.value }))}
        />
      </div>

      {error ? (
        <p className="rm-form-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="rm-form-actions">
        <button type="submit" className="rm-btn rm-btn-primary" disabled={submitting}>
          {submitting ? "Sending…" : "Send request"}
        </button>
        <span className="rm-help">We reply within two business days.</span>
      </div>
    </form>
  );
}

function FieldControl({
  field,
  value,
  options,
  onText,
  onToggle,
}: {
  field: Field;
  value: string | string[] | undefined;
  options: FieldOption[];
  onText: (value: string) => void;
  onToggle: (option: string) => void;
}) {
  const id = `rm-${field.name}`;
  const describedBy = field.help ? `${id}-help` : undefined;
  const label = (
    <label className="rm-label" htmlFor={id}>
      {field.label}
      {field.required ? <span className="rm-req" aria-hidden="true"> *</span> : null}
    </label>
  );
  const help = field.help ? (
    <span className="rm-help" id={`${id}-help`}>
      {field.help}
    </span>
  ) : null;

  if (field.type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset className="rm-field" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="rm-label">
          {field.label}
          {field.required ? <span className="rm-req"> *</span> : null}
        </legend>
        {help}
        <div className={`rm-checks ${options.length > 4 ? "rm-checks-2col" : ""}`}>
          {options.map((o) => (
            <label className="rm-check" key={o.value}>
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => onToggle(o.value)} />
              <span>{o.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div className="rm-field">
        {label}
        {help}
        <select
          id={id}
          className="rm-select"
          required={field.required}
          aria-describedby={describedBy}
          value={(value as string) ?? ""}
          onChange={(e) => onText(e.target.value)}
        >
          <option value="">Select…</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="rm-field">
        {label}
        {help}
        <textarea
          id={id}
          className="rm-textarea"
          required={field.required}
          placeholder={field.placeholder}
          aria-describedby={describedBy}
          value={(value as string) ?? ""}
          onChange={(e) => onText(e.target.value)}
        />
      </div>
    );
  }

  const inputType = field.type === "number" ? "number" : field.type === "date" ? "date" : field.type;
  return (
    <div className="rm-field">
      {label}
      {help}
      <input
        id={id}
        className="rm-input"
        type={inputType}
        required={field.required}
        placeholder={field.placeholder}
        inputMode={field.type === "tel" ? "tel" : field.type === "number" ? "numeric" : undefined}
        aria-describedby={describedBy}
        value={(value as string) ?? ""}
        onChange={(e) => onText(e.target.value)}
      />
      {field.checkAvailability && value ? (
        <span className="rm-date-hint">We&apos;ll confirm this date with you — go ahead and submit either way.</span>
      ) : null}
    </div>
  );
}
