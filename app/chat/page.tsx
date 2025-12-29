'use client'

import DoctorChat from '@/components/DoctorChat'

export default function ChatPage() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <DoctorChat isPopup={true} />
    </div>
  )
}

