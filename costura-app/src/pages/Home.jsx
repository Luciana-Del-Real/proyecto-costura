import { Link } from 'react-router-dom';
import { Video, Smartphone, Infinity as InfinityIcon, GraduationCap, Scissors, Feather, Palette, Shirt } from 'lucide-react';
import { testimonials } from '../data/courses';
import { useCourses } from '../context/CoursesContext';
import CourseCard from '../components/CourseCard';
import RevealSection from '../components/RevealSection';
import { useInView } from '../hooks/useInView';
const benefits = [
  { Icon: Video, title: 'Clases grabadas', desc: 'Accedé al contenido cuando quieras, sin horarios fijos.' },
  { Icon: Smartphone, title: 'Desde cualquier dispositivo', desc: 'Aprendé desde tu celular, tablet o computadora.' },
  { Icon: InfinityIcon, title: 'Acceso de por vida', desc: 'Una vez que comprás, el curso es tuyo para siempre.' },
  { Icon: GraduationCap, title: 'Instructora experta', desc: 'Aprendé con Daia, diseñadora con más de 10 años de experiencia.' },
];

const categories = [
  { Icon: Scissors, label: 'Costura' },
  { Icon: Feather, label: 'Bordado' },
  { Icon: Palette, label: 'Diseño Textil' },
  { Icon: Shirt, label: 'Workshops' },
];

const delays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

export default function Home() {
  const { courses } = useCourses();
  const featured = courses.slice(0, 3);
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
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0) 80%)' }} />
        <div className="relative z-10 w-full">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-center">
            <div className="hero-card text-theme mx-auto max-w-md">
              <h1 className="animate-fade-up-delay-1 text-3xl md:text-5xl font-bold heading-display mb-4 leading-tight" style={{ textShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
                Creá con tus<br />
                <span style={{ color: 'var(--accent)' }}>propias manos</span>
              </h1>
              <p className="animate-fade-up-delay-2 text-base md:text-lg mb-4 max-w-xl md:mx-0 opacity-95">
                Cursos online de costura, bordado y diseño textil para todos los niveles. A tu ritmo, con acompañamiento profesional.
              </p>
              <p className="animate-fade-up-delay-3 text-sm mb-6 max-w-lg md:mx-0 italic opacity-85">
                "Creemos que todas las personas pueden crear, incluso si empiezan desde cero."
              </p>
              <div className="animate-fade-up-delay-4 actions">
                <Link to="/cursos" className="btn-theme btn-hero transition-all duration-200 hover:scale-105 active:scale-95">Ver cursos</Link>
                <Link to="/registro" className="btn-theme btn-hero transition-all duration-200 hover:scale-105 active:scale-95">Registrarse gratis</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combined About section: side-by-side on md+ */}
      <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-2xl border border-theme p-8">
            <RevealSection>
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-[#6B4C3B]   mb-4">¿Qué es Grow?</h2>
                <p className="text-theme text-base leading-relaxed mb-6">
                  GROW es un estudio creativo dedicado a la costura, el bordado y el diseño, pensado para acompañarte paso a paso en tu aprendizaje. Acá vas a encontrar clases, herramientas, inspiración y una comunidad que crece junto a vos.
                </p>
                <p className="text-secondary font-medium text-lg">
                  ¿Te quedás a descubrir todo lo que podrías lograr con tus propias manos?
                </p>
              </div>
            </RevealSection>
          </div>

          <div className="bg-soft rounded-2xl border border-theme p-8 h-full flex items-start">
            <div ref={daiaRef} className={`flex flex-col md:flex-row md:items-start gap-6`}>
              <div className={`w-28 h-28 rounded-full overflow-hidden flex-shrink-0 reveal-scale visible border border-theme`}>
                    <img
                      src="/Images/IMG_7148.jpg"
                      alt="Daia"
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Images/IMG_7148.jpg'; }}
                    />
                </div>
                <div className={`reveal-right ${daiaInView ? 'visible' : ''}`}>
                <span className="text-secondary text-sm font-medium">¿Quién está detrás de Grow?</span>
                <h3 className="font-montserrat text-2xl font-bold text-[#6B4C3B] mt-1 mb-3">Hola, soy Daia</h3>
                <p className="text-theme opacity-90 leading-relaxed">
                  Diseñadora de indumentaria, diseñadora gráfica, modista y apasionada del bordado en todas sus formas. Tengo más de diez años de experiencia compartiendo lo que sé y aprendiendo siempre. En Grow no tenés que adaptarte a un sistema rígido: nosotros nos adaptamos a vos, a tu ritmo, a tus tiempos, a tus ganas de crear.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-soft">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#6B4C3B] text-center mb-10">¿Por qué elegirnos?</h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <RevealSection key={i} animation="reveal-scale" delay={delays[i]}>
                <div className="feature-card text-center p-6 rounded-2xl bg-white border border-theme hover:border-[#7A9E7E] hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                  <div className="flex items-center justify-center mb-3">
                    <div className="icon-wrapper" aria-hidden>
                      <b.Icon className="benefit-icon" color="#E83E8C" aria-hidden />
                    </div>
                  </div>
                  <h3 className="font-semibold text-theme mb-2">{b.title}</h3>
                  <p className="text-theme text-sm">{b.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-soft">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#6B4C3B] text-center mb-10">Nuestras especialidades</h2>
          </RevealSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <RevealSection key={i} animation="reveal" delay={delays[i]}>
                <Link to="/cursos" className="block bg-white rounded-2xl p-6 text-center border border-theme hover:border-[#C4785A] hover:-translate-y-1 hover:shadow-md transition-all duration-300 feature-card">
                  <div className="flex items-center justify-center mb-2">
                    <div className="icon-wrapper" aria-hidden>
                      <cat.Icon className="specialty-icon" color="#4E6D5B" aria-hidden />
                    </div>
                  </div>
                  <p className="font-medium text-theme text-sm">{cat.label}</p>
                </Link>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#6B4C3B] text-center mb-10">Lo que dicen nuestras alumnas</h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={t.id} animation="reveal" delay={delays[i]}>
                <div className="bg-soft rounded-2xl p-6 border border-theme hover:-translate-y-1 hover:shadow-sm transition-all duration-300 h-full">
                  <p className="text-theme text-sm mb-4 italic leading-relaxed">"{t.text}"</p>
                  <div>
                    <p className="font-semibold text-theme text-sm">{t.name}</p>
                    <p className="text-theme text-xs">{t.course}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <RevealSection animation="reveal-scale">
        <section className="py-16 px-4 bg-secondary">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#6B4C3B] mb-4">En Grow, siempre hay un espacio para vos</h2>
            <p className="text-white mb-8">Registrate gratis y comenzá tu primer curso hoy.</p>
            <Link to="/registro" className="btn-theme btn-hero transition-all duration-200 hover:scale-105 active:scale-95">
              Empezar ahora
            </Link>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
