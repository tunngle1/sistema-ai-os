import { NextResponse } from "next/server";
import { createLeadWithWelcome, processLeadMessage } from "@/lib/services/sales";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.gameId || !body.name || !body.phone) {
      return NextResponse.json(
        { error: "Укажите gameId, name и phone" },
        { status: 400 },
      );
    }

    const lead = await createLeadWithWelcome(body.gameId, {
      name: body.name,
      phone: body.phone,
      email: body.email,
      source: body.source,
      platform: body.platform,
      utm: body.utm,
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка создания заявки" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.leadId || !body.message) {
      return NextResponse.json(
        { error: "Укажите leadId и message" },
        { status: 400 },
      );
    }

    const result = await processLeadMessage(body.leadId, body.message);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка обработки сообщения" },
      { status: 500 },
    );
  }
}
