import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
    try {
        const { imageBase64, mediaType } = await request.json();

        if (!imageBase64) {
            return NextResponse.json({ error: 'Imagem não fornecida' }, { status: 400 });
        }

        const response = await client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: mediaType || 'image/jpeg',
                                data: imageBase64,
                            },
                        },
                        {
                            type: 'text',
                            text: `Esta é uma planilha de scouts de futebol preenchida à mão durante uma partida.

As colunas são: JOGADORES, GOLS, ASSISTÊNCIAS, DEFESAS, ADVERTÊNCIAS (pode aparecer como ADVERT).

Regras de leitura dos marcadores (palitinhos):
- I = 1
- II ou Γ (formato de canto/ângulo) = 2
- III = 3
- IIII = 4
- ⊠ ou □ com X/diagonal (portão) = 5
- Combine: ⊠Γ = 7, ⊠I = 6, etc.

Jogadores com nome riscado (tachado) NÃO jogaram — ignore-os completamente.
Jogadores sem nome riscado jogaram, mesmo que todos os scouts sejam zero.

Retorne SOMENTE um JSON válido, sem texto adicional, no formato:
{
  "players": [
    {
      "name": "Nome do Jogador",
      "goals": 0,
      "assists": 0,
      "difficult_saves": 0,
      "warnings": 0
    }
  ]
}`,
                        },
                    ],
                },
            ],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
            return NextResponse.json({ error: 'Resposta inválida da IA' }, { status: 500 });
        }

        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return NextResponse.json({ error: 'Não foi possível extrair JSON da resposta' }, { status: 500 });
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json(parsed);
    } catch (error: any) {
        console.error('Erro ao processar imagem:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
