import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// =========================================================
// Pools de dados fake realistas (nomes BR, UFs, especialidades)
// =========================================================
const FIRST_NAMES = [
  "Marina", "João", "Isabela", "Ricardo", "Fernanda", "Lucas", "Ana", "Pedro",
  "Carolina", "Gabriel", "Beatriz", "Rafael", "Juliana", "Thiago", "Larissa",
  "Matheus", "Camila", "Gustavo", "Mariana", "Leonardo", "Amanda", "Felipe",
  "Vitória", "Bruno", "Letícia", "Henrique", "Sofia", "Diego", "Valentina",
  "Daniel", "Helena", "Arthur", "Laura", "Davi", "Giovanna", "Bernardo",
  "Manuela", "Samuel", "Alice", "Enzo", "Heloísa", "Eduardo", "Patrícia",
  "André", "Renata", "Rodrigo", "Tatiana", "Marcelo", "Paula", "Vinícius",
];

const LAST_NAMES = [
  "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa",
  "Ferreira", "Rodrigues", "Almeida", "Carvalho", "Nascimento", "Araújo",
  "Vieira", "Gomes", "Barbosa", "Rocha", "Dias", "Ramos", "Mendes",
  "Martins", "Cardoso", "Moreira", "Correia", "Melo", "Castro", "Cavalcante",
  "Ribeiro", "Alves", "Batista", "Freitas", "Teixeira", "Monteiro", "Moura",
  "Pinto", "Andrade", "Fernandes", "Lopes", "Machado", "Xavier", "Coelho",
  "Duarte", "Campos", "Sampaio", "Borges", "Cunha", "Guimarães",
];

const UFS = [
  "SP", "RJ", "MG", "RS", "PR", "SC", "BA", "GO", "DF", "PE",
  "CE", "ES", "MA", "PA", "MT", "MS",
];

const SPECIALTIES = [
  "dermatologia",
  "cirurgia_plastica",
  "ginecologia",
  "medicina_estetica",
  "cirurgia_geral",
  "cirurgia_vascular",
  "oftalmologia",
  "otorrinolaringologia",
  "endocrinologia",
  "clinica_medica",
] as const;

const DDDS = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const payloadSchema = z.object({
  count: z.number().int().min(1).max(500),
});

// =========================================================
// POST — gera N leads fake com dados realistas
// is_test = false para aparecer no sorteio (QA completo).
// Use "Limpar TUDO" antes do evento pra zerar.
// =========================================================
export async function POST(req: NextRequest) {
  const auth = await createClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: admin } = await auth
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "count deve ser inteiro entre 1 e 500" },
      { status: 422 },
    );
  }

  const { count } = parsed.data;
  const svc = createServiceClient();

  // Evita colisão de CRM dentro do próprio batch
  const usedCrms = new Set<string>();
  const now = new Date().toISOString();

  const fakeLeads = Array.from({ length: count }).map((_, i) => {
    const first = pick(FIRST_NAMES);
    const last = pick(LAST_NAMES);
    const uf = pick(UFS);

    let crm = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = `${randInt(100000, 999999)} ${uf}`;
      if (!usedCrms.has(candidate)) {
        crm = candidate;
        usedCrms.add(candidate);
        break;
      }
    }
    if (!crm) {
      crm = `${randInt(1000000, 9999999)} ${uf}`;
      usedCrms.add(crm);
    }

    const ddd = pick(DDDS);
    const phone = `${ddd}9${randInt(10000000, 99999999)}`;

    const suffix = `${Date.now().toString(36)}-${i}`;
    const email = `${first.toLowerCase()}.${last
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")}.${suffix}@teste-cbcd.example`;

    return {
      full_name: `${first} ${last}`,
      specialty: pick(SPECIALTIES),
      crm,
      phone,
      email,
      lgpd_consent: true,
      consent_version: "v1.0-2026-04-23-seed",
      is_test: false, // real lead — aparece no sorteio
      quiz_completed_at: now,
      source: "admin_seed",
      device_hint: "seed_batch",
    };
  });

  const { data: inserted, error } = await svc
    .from("leads")
    .insert(fakeLeads)
    .select("id");

  if (error) {
    console.error("[leads/seed] insert failed", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    created: inserted?.length ?? 0,
    requested: count,
  });
}
