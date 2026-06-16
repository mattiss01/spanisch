'use client';

import { Exercise } from '@/lib/types';
import FillBlank from './exercises/FillBlank';
import Translation from './exercises/Translation';
import MultipleChoice from './exercises/MultipleChoice';
import ErrorCorrection from './exercises/ErrorCorrection';
import Conjugation from './exercises/Conjugation';
import Reading from './exercises/Reading';
import Vocabulary from './exercises/Vocabulary';
import Conversation from './exercises/Conversation';

interface Props {
  exercise: Exercise;
  onComplete?: (correct: number, total: number) => void;
}

export default function ExerciseRenderer({ exercise, onComplete }: Props) {
  switch (exercise.type) {
    case 'fill_blank':
      return <FillBlank exercise={exercise} onComplete={onComplete} />;
    case 'translation':
      return <Translation exercise={exercise} onComplete={onComplete} />;
    case 'multiple_choice':
      return <MultipleChoice exercise={exercise} onComplete={onComplete} />;
    case 'error_correction':
      return <ErrorCorrection exercise={exercise} onComplete={onComplete} />;
    case 'conjugation':
      return <Conjugation exercise={exercise} onComplete={onComplete} />;
    case 'reading':
      return <Reading exercise={exercise} onComplete={onComplete} />;
    case 'vocabulary':
      return <Vocabulary exercise={exercise} onComplete={onComplete} />;
    case 'conversation':
      return <Conversation exercise={exercise} onComplete={onComplete} />;
  }
}
