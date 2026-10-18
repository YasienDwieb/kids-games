import AsyncStorage from '@react-native-async-storage/async-storage';
import { findUnit } from '..';
import { badgesEarned, finishLesson, lessonStars, nextLessonIndex, openChest, schoolStore, unitDone } from '../progress';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('scores a lesson by its wrong taps', () => {
  expect(lessonStars(0, 4)).toBe(3);
  expect(lessonStars(2, 4)).toBe(2);
  expect(lessonStars(5, 4)).toBe(1);
});

it('keeps the best stars and pays out only the improvement', async () => {
  const unit = findUnit('en', 'math-kg1-u1')!;
  const lesson = unit.lessons[0];
  expect(await finishLesson('math', lesson, 3)).toEqual({ stars: 1, gained: 1 });
  expect(await finishLesson('math', lesson, 0)).toEqual({ stars: 3, gained: 2 });
  expect(await finishLesson('math', lesson, 9)).toEqual({ stars: 1, gained: 0 });
  expect((await schoolStore.get()).lessons[lesson.id].stars).toBe(3);
});

it('unlocks stops in order and opens the chest once the unit is done', async () => {
  const unit = findUnit('en', 'math-kg1-u1')!;
  let p = await schoolStore.get();
  expect(nextLessonIndex(unit, p)).toBe(0);
  expect(await openChest(unit)).toBe(false);
  for (const l of unit.lessons) await finishLesson('math', l, 0);
  p = await schoolStore.get();
  expect(unitDone(unit, p)).toBe(true);
  expect(nextLessonIndex(unit, p)).toBe(-1);
  expect(badgesEarned([unit], p)).toEqual(['bronze', 'silver', 'gold']);
  expect(await openChest(unit)).toBe(true);
  expect(await openChest(unit)).toBe(false);
});
