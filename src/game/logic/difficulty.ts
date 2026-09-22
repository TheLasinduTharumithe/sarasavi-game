export interface NumericRange {
  min: number
  max: number
}

export interface DifficultyRanges {
  start: NumericRange
  middle: NumericRange
  end: NumericRange
}

export function interpolateDifficultyRange(
  ranges: DifficultyRanges,
  progressValue: number,
): NumericRange {
  const progress = Math.min(1, Math.max(0, progressValue))
  const inFirstHalf = progress <= 0.5
  const segmentProgress = inFirstHalf ? progress * 2 : (progress - 0.5) * 2
  const from = inFirstHalf ? ranges.start : ranges.middle
  const to = inFirstHalf ? ranges.middle : ranges.end

  return {
    min: from.min + (to.min - from.min) * segmentProgress,
    max: from.max + (to.max - from.max) * segmentProgress,
  }
}
