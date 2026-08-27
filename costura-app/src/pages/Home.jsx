import { Link } from 'react-router-dom';
import { Video, Smartphone, Infinity as InfinityIcon, GraduationCap, Scissors, Feather, Palette, Shirt, CalendarDays, ShoppingBag } from 'lucide-react';
import { testimonials } from '../data/courses';
import CourseCard from '../components/CourseCard';
import RevealSection from '../components/RevealSection';
import TestimonialCard from '../components/TestimonialCard';
import { useInView } from '../hooks/useInView';
const benefits = [
  { Icon: Video, title: 'CLASES GRABADAS', desc: 'Accedé al contenido cuando quieras, sin horarios fijos.' },
  { Icon: Smartphone, title: 'DESDE CUALQUIER DISPOSITIVO', desc: 'Aprendé desde tu celular, tablet o computadora.' },
  { Icon: InfinityIcon, title: 'ACCESO DE POR VIDA', desc: 'Una vez que comprás, el curso es tuyo para siempre.' },
  { Icon: GraduationCap, title: 'INSTRUCTURA EXPERTA', desc: 'Aprendé con Daia, diseñadora con más de 10 años de experiencia.' },
];

const categories = [
  { Icon: Scissors, label: 'COSTURA' },
  { Icon: Feather, label: 'BORDADO' },
  { Icon: Palette, label: 'DISEÑO TEXTIL' },
  { Icon: Shirt, label: 'WORKSHOPS' },
  { Icon: CalendarDays, label: 'EVENTOS' },
  { Icon: ShoppingBag, label: 'PRODUCTOS Y SERVICIOS' },
];

const delays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];


export default function Home() {
  const [daiaRef, daiaInView] = useInView(0.2);

  return (
    <div>
      {/* Hero */}
      <section
        className="relative min-h-[60vh] md:min-h-[80vh] flex items-center py-12 px-4 bg-cover bg-center bg-no-repeat hero-no-sep"
        style={{
          backgroundImage: "url('/Images/IMG_8373.jpg')",
          backgroundPosition: 'right 20%',
          backgroundSize: 'cover'
        }}
      >
        <div className="absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
            <div className="hero-card text-text-ink mx-auto max-w-md">
              <h1 className="animate-fade-up-delay-1 text-3xl md:text-5xl font-bold font-display mb-4 leading-tight" style={{ textShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
                Creá con tus<br />
                <span className="font-display" style={{ color: 'var(--accent)' }}>propias manos</span>
              </h1>
              <p className="font-body animate-fade-up-delay-2 text-base md:text-lg mb-4 max-w-xl md:mx-0 opacity-95">
                Cursos online de costura, bordado y diseño textil para todos los niveles. A tu ritmo, con acompañamiento profesional.
              </p>
              <p className="font-dancing animate-fade-up-delay-3 text-xl md:text-2xl mb-6 max-w-lg md:mx-0 opacity-90">
                "Creemos que todas las personas pueden crear, incluso si empiezan desde cero."
              </p>
              <div className="animate-fade-up-delay-4 actions">
                <Link to="/cursos" className="btn btn-primary btn-hero transition-all duration-200 hover:scale-105 active:scale-95">Ver cursos</Link>
                <Link to="/registro" className="btn btn-primary btn-hero transition-all duration-200 hover:scale-105 active:scale-95">Registrarse gratis</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combined About section: side-by-side on md+ */}
      <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-glow rounded-2xl p-8 h-full flex items-center">
              <RevealSection>
                <div className="w-full flex flex-col items-center text-center">
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary shadow-[0_0_20px_rgba(232,62,140,0.30)] mb-5">
                    <img
                      src="/Images/IMG_6837_circle.jpg"
                      alt="Grow Creative Education Studio"
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Images/IMG_6837_circle.jpg'; }}
                    />
                  </div>
                  <span className="text-primary font-medium text-lg block text-center">¿Quiénes somos?</span>
                  <h3 className="font-display text-4xl font-bold text-text-ink mt-1 mb-3 text-center">Grow</h3>
                  <p className="text-text-ink opacity-90 leading-relaxed text-center">
                    Estudio creativo dedicado a la costura, el bordado y el diseño, pensado para acompañarte paso a paso en tu aprendizaje. Acá vas a encontrar clases, herramientas, inspiración y una comunidad que crece junto a vos.
                  </p>
                  <p className="text-primary font-medium text-lg mt-3">
                    ¿Te quedás a descubrir todo lo que podrías lograr con tus propias manos?
                  </p>
                </div>
              </RevealSection>
            </div>

            <div className="card-glow rounded-2xl p-8 h-full flex items-center">
              <div ref={daiaRef} className={`w-full`}>
                <div className={`mb-5 flex justify-center reveal-scale visible`}>
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_20px_rgba(232,62,140,0.30)]">
                    <img
                      src="/Images/IMG_7148_circle.jpg"
                      alt="Daia"
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Images/IMG_7148_circle.jpg'; }}
                    />
                  </div>
                </div>
                <div className={`reveal-right ${daiaInView ? 'visible' : ''}`}>
                  <span className="text-primary font-medium text-lg block text-center">¿Quién está detrás de Grow?</span>
                  <h3 className="font-display text-4xl font-bold text-text-ink mt-1 mb-3 text-center">¡Hola! soy Daia</h3>
                  <p className="text-text-ink opacity-90 leading-relaxed text-center">
                    Diseñadora de indumentaria, diseñadora gráfica, modista y apasionada del bordado en todas sus formas. Tengo más de diez años de experiencia compartiendo lo que sé y aprendiendo siempre. En Grow no tenés que adaptarte a un sistema rígido: nosotros nos adaptamos a vos, a tu ritmo, a tus tiempos, a tus ganas de crear.
                  </p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-10 px-4">
          <RevealSection>
            <h2 className="font-display font-bold text-4xl text-text-ink text-center mb-10">¿Por qué elegirnos?</h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <RevealSection key={i} animation="reveal-scale" delay={delays[i]}>
                <div className="feature-card card-glow text-center p-6 rounded-2xl h-full">
                  <div className="flex items-center justify-center mb-3">
                    <div className="icon-wrapper" aria-hidden>
                      <b.Icon className="benefit-icon" color="var(--color-accent)" aria-hidden />
                    </div>
                  </div>
                  <p className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{b.title}</p>
                  <p className="font-body text-text-ink text-sm leading-relaxed">{b.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
      </section>

      <div className="seam-divider" aria-hidden="true" />

      {/* Categories */}
      <section className="bg-white py-10 px-4">
          <RevealSection>
            <h2 className="font-display font-bold text-4xl text-text-ink text-center mb-10">Nuestras especialidades</h2>
          </RevealSection>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <RevealSection key={i} animation="reveal" delay={delays[i]}>
                <div className="card-glow feature-card rounded-2xl p-6 text-center h-full cursor-default" aria-disabled="true">
                  <div className="flex items-center justify-center mb-2">
                    <div className="icon-wrapper" aria-hidden>
                      <cat.Icon className="specialty-icon" color="var(--color-accent)" aria-hidden />
                    </div>
                  </div>
                  <p className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{cat.label}</p>
                </div>
              </RevealSection>
            ))}
          </div>
      </section>

      <div className="seam-divider" aria-hidden="true" />

      {/* Testimonials */}
      <section className="py-10 px-4">
          <RevealSection>
            <h2 className="font-display font-bold text-4xl text-text-ink text-center mb-10">Lo que dicen nuestras alumnas</h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {testimonials.map((t, i) => (
              <RevealSection key={t.id} animation="reveal" delay={delays[i]} className="h-full">
                <TestimonialCard testimonial={t} />
              </RevealSection>
            ))}
          </div>
      </section>

      <div className="seam-divider" aria-hidden="true" />

      {/* CTA */}
      <section className="bg-white py-10 px-4">
        <RevealSection animation="reveal-scale">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display font-bold text-4xl text-text-ink mb-4">En Grow, siempre hay un espacio para vos</h2>
              <p className="text-text-ink mb-8">Registrate gratis y comenzá tu primer curso hoy.</p>
              <Link to="/registro" className="btn btn-primary btn-hero transition-all duration-200 hover:scale-105 active:scale-95">
                Empezar ahora
              </Link>
            </div>
        </RevealSection>
      </section>
    </div>
  );
}
