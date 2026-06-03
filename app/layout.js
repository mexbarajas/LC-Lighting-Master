export const metadata = {
  title: 'LC · Lighting Master',
  description: 'NCQLP Exam Prep by Luxart LLC',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
