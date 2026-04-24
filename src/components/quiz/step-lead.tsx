"use client";

import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leadSchema, type LeadFormValues } from "@/lib/quiz/schemas";
import { MEDICAL_SPECIALTIES } from "@/lib/quiz/specialties";
import { toTitleCaseName } from "@/lib/quiz/text";
import { useQuiz } from "@/lib/quiz/context";
import { LgpdDialog } from "./lgpd-dialog";
import { StickyPortal } from "./sticky-portal";

export function StepLead() {
  const { dispatch } = useQuiz();
  const [lgpdOpen, setLgpdOpen] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    setFocus,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: { consent: false },
    mode: "onBlur",
  });

  const specialty = watch("specialty");

  const onSubmit = async (data: LeadFormValues) => {
    clearErrors("crm");
    setSubmitError(null);
    setChecking(true);

    // Pré-valida se o CRM já foi cadastrado (evita o médico perder tempo
    // respondendo para descobrir só no final que já participou).
    try {
      const res = await fetch("/api/check-crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crm: data.crm }),
      });
      if (res.ok) {
        const body = (await res.json()) as { exists: boolean };
        if (body.exists) {
          setError("crm", {
            type: "duplicate",
            message:
              "Este CRM já participou do quiz. Cada médico concorre apenas uma vez.",
          });
          setFocus("crm");
          setChecking(false);
          return;
        }
      }
      // Em caso de erro na checagem, segue o fluxo — o índice único do
      // banco ainda barra duplicidade no final.
    } catch {
      // mesmo comportamento — fail open para a checagem, fail close no DB
    } finally {
      setChecking(false);
    }

    dispatch({
      type: "setLead",
      lead: {
        fullName: data.fullName.trim(),
        specialty: data.specialty,
        specialtyOther: data.specialtyOther?.trim() || undefined,
        crm: data.crm.trim().toUpperCase(),
        phone: data.phone,
        email: data.email.trim().toLowerCase(),
        consent: true,
      },
    });
  };

  // Nome: aplica Title Case em tempo real (respeita "da", "de", "dos"...)
  const fullNameReg = register("fullName", {
    onChange: (e) => {
      const formatted = toTitleCaseName(e.target.value);
      if (formatted !== e.target.value) {
        e.target.value = formatted;
      }
    },
  });

  // CRM: uppercase automático enquanto digita
  const crmReg = register("crm", {
    onChange: (e) => {
      const upper = e.target.value.toUpperCase();
      if (upper !== e.target.value) {
        e.target.value = upper;
      }
      if (errors.crm) clearErrors("crm");
    },
  });

  const isBusy = checking || isSubmitting;

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.2fr] lg:gap-16">
      {/* ============== HERO ============== */}
      <div className="flex flex-col justify-center">
        <span className="mb-3 inline-block text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--color-bronze-600)]">
          Experiência exclusiva
        </span>
        <h1 className="mb-4 font-display text-[clamp(2rem,4vw+1rem,3.5rem)] leading-[1.02] tracking-tight">
          Bem-vindo<br />ao estande<br /><span className="text-[var(--color-bronze-500)]">Contourline</span>
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-[var(--color-clinical-700)] md:text-base">
          Responda três perguntas sobre o triLift® e concorra ao sorteio na
          festa de encerramento do CBCD.
        </p>
        <div className="mt-5 flex items-center gap-4 text-[10px] uppercase tracking-[0.24em] text-[var(--color-clinical-500)] md:mt-8 md:text-xs">
          <span className="h-px w-10 bg-[var(--color-clinical-300)] md:w-12" />
          <span>~2 min · 3 perguntas</span>
        </div>
        <p className="mt-4 max-w-md text-[12px] leading-relaxed text-[var(--color-clinical-500)] md:mt-5 md:text-[13px]">
          Para validar a participação no sorteio é necessário seguir{" "}
          <span className="font-medium text-[var(--color-navy-900)]">@contourlinemed</span>{" "}
          e{" "}
          <span className="font-medium text-[var(--color-navy-900)]">@lumenisoficial</span>.
        </p>
      </div>

      {/* ============== FORM ============== */}
      <form
        id="lead-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="grid gap-4 md:gap-5 md:grid-cols-2">
          {/* Nome (full width) */}
          <div className="md:col-span-2">
            <Label htmlFor="fullName" className="mb-2 block">
              Nome completo
            </Label>
            <Input
              id="fullName"
              autoComplete="name"
              autoCapitalize="words"
              autoFocus
              placeholder="Dra. Marina Carvalho"
              aria-invalid={!!errors.fullName}
              {...fullNameReg}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Especialidade */}
          <div>
            <Label htmlFor="specialty" className="mb-2 block">
              Especialidade
            </Label>
            <Controller
              name="specialty"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="specialty"
                    aria-invalid={!!errors.specialty}
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDICAL_SPECIALTIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.specialty && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">
                Selecione uma especialidade
              </p>
            )}
          </div>

          {/* CRM */}
          <div>
            <Label htmlFor="crm" className="mb-2 block">
              CRM
            </Label>
            <Input
              id="crm"
              placeholder="123456 SP"
              autoComplete="off"
              autoCapitalize="characters"
              aria-invalid={!!errors.crm}
              className="uppercase"
              {...crmReg}
            />
            {errors.crm && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">
                {errors.crm.message}
              </p>
            )}
          </div>

          {/* Outra especialidade (condicional) */}
          {specialty === "outros" && (
            <div className="md:col-span-2 animate-scale-in">
              <Label htmlFor="specialtyOther" className="mb-2 block">
                Qual especialidade médica?
              </Label>
              <Input
                id="specialtyOther"
                placeholder="Ex: neurologia, reumatologia, urologia…"
                {...register("specialtyOther")}
              />
            </div>
          )}

          {/* Telefone */}
          <div>
            <Label htmlFor="phone" className="mb-2 block">
              Telefone (WhatsApp)
            </Label>
            <PhoneInput
              id="phone"
              aria-invalid={!!errors.phone}
              {...register("phone")}
            />
            {errors.phone && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <Label htmlFor="email" className="mb-2 block">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="marina@clinica.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-[var(--destructive)]">
                {errors.email.message}
              </p>
            )}
          </div>
        </div>

        {/* ============== LGPD ============== */}
        <div className="mt-1 flex items-start gap-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 md:p-5">
          <Controller
            name="consent"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="consent"
                checked={field.value}
                onCheckedChange={(v) => field.onChange(v === true)}
                className="mt-0.5"
              />
            )}
          />
          <label
            htmlFor="consent"
            className="flex-1 cursor-pointer text-[13px] leading-relaxed text-[var(--color-clinical-700)] md:text-sm"
          >
            Autorizo a Contourline a tratar meus dados para participação no
            sorteio e envio de comunicações profissionais, conforme descrito no{" "}
            <button
              type="button"
              onClick={() => setLgpdOpen(true)}
              className="font-medium text-[var(--color-navy-900)] underline decoration-[var(--color-bronze-500)] underline-offset-4 hover:decoration-[var(--color-navy-900)]"
            >
              termo de consentimento LGPD
            </button>
            .
          </label>
        </div>
        {errors.consent && (
          <p className="-mt-2 text-xs text-[var(--destructive)]">
            {errors.consent.message}
          </p>
        )}

        {submitError && (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] border border-[var(--destructive)]/40 bg-[var(--destructive)]/5 p-3 text-sm text-[var(--destructive)]"
          >
            {submitError}
          </div>
        )}

        {/* ============== CTA ============== */}
        <div className="mt-3 hidden justify-end sm:flex">
          <Button
            type="submit"
            variant="primary"
            size="xl"
            disabled={isBusy}
            className="min-w-[220px]"
          >
            {isBusy ? "Validando..." : "Iniciar quiz"}
          </Button>
        </div>

      </form>

      {/* Mobile sticky CTA — portal pra document.body
          (escapa do containing block criado por animate-fade-up ancestral) */}
      <StickyPortal>
        <div
          className="fixed bottom-0 left-0 right-0 z-[70] border-t border-[var(--border)] bg-[var(--background)]/95 px-4 pt-4 backdrop-blur-md sm:hidden"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
          }}
        >
          <Button
            type="submit"
            form="lead-form"
            variant="primary"
            size="xl"
            disabled={isBusy}
            className="w-full"
          >
            {isBusy ? "Validando..." : "Iniciar quiz"}
          </Button>
        </div>
      </StickyPortal>

      <LgpdDialog open={lgpdOpen} onClose={() => setLgpdOpen(false)} />
    </div>
  );
}
