import { ACHIEVEMENT_THRESHOLDS } from '../constants.ts'

export function getAchievementTitle(score: number): string {
  return (
    ACHIEVEMENT_THRESHOLDS.find(
      (achievement) => score >= achievement.minimumScore,
    )?.title ?? 'Book Beginner'
  )
}
