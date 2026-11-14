import type { ReactNode } from 'react'

import E1LiftOrigin from './e1/E1LiftOrigin'
import E2SpeedRatio from './e2/E2SpeedRatio'
import E3AlphaStall from './e3/E3AlphaStall'

/** 实验组件注册表：component key → 组件 */
const REGISTRY: Record<string, (props: { values: Record<string, number> }) => ReactNode> = {
  'e1-lift-origin': E1LiftOrigin as (props: { values: Record<string, number> }) => ReactNode,
  'e2-speed-ratio': E2SpeedRatio as (props: { values: Record<string, number> }) => ReactNode,
  'e3-alpha-stall': E3AlphaStall as (props: { values: Record<string, number> }) => ReactNode,
}

export function getExperimentComponent(key: string) {
  return REGISTRY[key] ?? null
}
