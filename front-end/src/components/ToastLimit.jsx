import { useEffect } from 'react'
import toast, { useToasterStore } from "react-hot-toast";

export default function ToastLimit({ max = 0 }) {
  const { toasts } = useToasterStore()

  useEffect(() => {
    toasts
      .filter(t => t.visible)
      .filter((_, i) => i >= max) 
      .forEach(t => toast.dismiss(t.id))
  }, [toasts, max])

  return null
}
