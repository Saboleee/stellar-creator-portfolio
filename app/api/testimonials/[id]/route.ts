import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '../route';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body.featured !== 'boolean') {
    return NextResponse.json(
      { error: '`featured` (boolean) is required in the request body' },
      { status: 400 },
    );
  }

  const store = getStore();
  const testimonial = store.find((t) => t.id === id);

  if (!testimonial) {
    return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
  }

  testimonial.featured = body.featured;

  return NextResponse.json({ testimonial });
}
