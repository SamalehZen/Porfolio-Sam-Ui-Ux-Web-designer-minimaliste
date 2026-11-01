import { useEffect, useState } from 'react'

export function useClock() {
  const [zone, setZone] = useState('GMT+3')
  useEffect(() => {
    const read = () => {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Djibouti',
        timeZoneName: 'longOffset',
      }).formatToParts(new Date())
      const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'
      const offset = parseInt(name.slice(3), 10) || 0
      setZone(`GMT${offset < 0 ? '-' : '+'}${Math.abs(offset)}`)
    }
    read()
    const id = window.setInterval(read, 30 * 60 * 1000)
    return () => window.clearInterval(id)
  }, [])
  return { lat: 11.5721, lng: 43.1456, zone }
}
