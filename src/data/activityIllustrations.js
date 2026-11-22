const images = import.meta.glob('../assets/activities/{events,lesson,3d-printer,rental,tools}{,-dark}.png', { eager: true, import: 'default' })

export function activityIllustration(subject, dark) {
  return images[`../assets/activities/${subject}${dark ? '-dark' : ''}.png`]
}
