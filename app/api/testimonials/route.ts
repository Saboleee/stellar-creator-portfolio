import { NextRequest, NextResponse } from 'next/server';
import type { Testimonial } from '@/components/testimonials';

// In-memory store (mirrors component data; replace with Prisma in production)
const store: Testimonial[] = [
  {
    id: '1',
    clientId: 'client-001',
    creatorId: 'creator-001',
    bountyId: 'bounty-101',
    author: 'Sarah Chen',
    role: 'Product Manager, TechStartup',
    quote:
      'Stellar connected us with incredible designers who transformed our product. The process was seamless and professional.',
    rating: 5,
    featured: true,
    createdAt: '2024-11-12T10:00:00Z',
    bountyTitle: 'Dashboard UI Redesign',
    creatorProfile: { name: 'Alex Rivera', slug: 'alex-rivera' },
  },
  {
    id: '2',
    clientId: 'client-002',
    creatorId: 'creator-002',
    bountyId: 'bounty-102',
    author: 'Marcus Johnson',
    role: 'UI/UX Designer',
    quote:
      'As a freelancer, this platform gave me access to high-quality projects and clients who truly value creative work.',
    rating: 5,
    featured: true,
    createdAt: '2024-12-01T14:30:00Z',
    bountyTitle: 'Mobile App Prototype',
    creatorProfile: { name: 'Jordan Kim', slug: 'jordan-kim' },
    videoUrl: 'https://assets.stellar.app/testimonials/marcus-johnson.mp4',
  },
  {
    id: '3',
    clientId: 'client-003',
    creatorId: 'creator-003',
    bountyId: 'bounty-103',
    author: 'Emily Rodriguez',
    role: 'Marketing Director, GrowthCo',
    quote:
      'The bounty system is revolutionary. We found the perfect content creator for our campaign in days, not weeks.',
    rating: 5,
    featured: true,
    createdAt: '2025-01-08T09:15:00Z',
    bountyTitle: 'Brand Campaign Content',
    creatorProfile: { name: 'Sam Okafor', slug: 'sam-okafor' },
  },
];

export function getStore(): Testimonial[] {
  return store;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featuredParam = searchParams.get('featured');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10), 50);

  let results = [...store];

  if (featuredParam === 'true') {
    results = results.filter((t) => t.featured);
  } else if (featuredParam === 'false') {
    results = results.filter((t) => !t.featured);
  }

  results = results.slice(0, limit);

  return NextResponse.json({ testimonials: results, total: results.length });
}
