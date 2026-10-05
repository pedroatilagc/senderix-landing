import { AppTour } from '@/components/app-tour/AppTour'
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
        <AppTour />
        <Pricing />
      </main>
      <Footer />
    </>
  )
}
