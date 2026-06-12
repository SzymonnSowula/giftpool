interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ width = '100%', height = 16, radius = 'var(--r-xs)', style }: SkeletonProps) {
  return (
    <div
      className="skeleton"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
        ...style,
      }}
    />
  )
}
