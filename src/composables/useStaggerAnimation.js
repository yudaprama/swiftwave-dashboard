import { onMounted } from 'vue'

export function useStaggerAnimation(containerRef, childSelector = 'tr', delay = 50) {
  onMounted(() => {
    if (!containerRef.value) return
    const children = containerRef.value.querySelectorAll(childSelector)
    children.forEach((child, index) => {
      child.style.opacity = '0'
      child.style.transform = 'translateY(8px)'
      child.style.transition = `opacity 200ms ease ${index * delay}ms, transform 200ms ease ${index * delay}ms`
      requestAnimationFrame(() => {
        child.style.opacity = '1'
        child.style.transform = 'translateY(0)'
      })
    })
  })
}
