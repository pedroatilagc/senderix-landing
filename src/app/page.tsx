import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Nav } from '@/components/Nav'
import { Pricing } from '@/components/Pricing'

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
