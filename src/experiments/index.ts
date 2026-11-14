import type { ReactNode } from 'react'

import E1LiftOrigin from './e1/E1LiftOrigin'

/** 实验组件注册表：component key → 组件 */
const REGISTRY: Record<string, (props: { values: Record<string, number> }) => ReactNode> = {
  'e1-lift-origin': E1LiftOrigin as (props: { values: Record<string, number> }) => ReactNode,
}

export function getExperimentComponent(key: string) {
  return REGISTRY[key] ?? null
}
