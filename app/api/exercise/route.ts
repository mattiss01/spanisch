import { NextRequest, NextResponse } from 'next/server';
import { ExerciseType } from '@/lib/types';
import { verbToExercise, pickNextVerb, findVerb } from '@/lib/verb-catalog';
import { germanVerbToExercise, pickNextGermanVerb, findGermanVerb } from '@/lib/verb-catalog-de';

export async function POST(req: NextRequest) {
  const { type, verb, knownVerbs, language } = (await req.json()) as {
    type: ExerciseType;
    verb?: string;
    knownVerbs?: string[];
    language?: string;
  };

  if (type === 'conjugation') {
    if (language === 'es_to_de') {
      const catalogVerb = verb ? findGermanVerb(verb) : null;
      const target = catalogVerb ?? pickNextGermanVerb(knownVerbs ?? []);
      return NextResponse.json(germanVerbToExercise(target));
    }
    const catalogVerb = verb ? findVerb(verb) : null;
    const target = catalogVerb ?? pickNextVerb(knownVerbs ?? []);
    return NextResponse.json(verbToExercise(target));
  }

  return NextResponse.json({ error: 'Nicht unterstützt.' }, { status: 400 });
}
