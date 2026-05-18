import { Link } from 'react-router-dom';
import { testimonials } from '../data/courses';
import { useCourses } from '../context/CoursesContext';
import CourseCard from '../components/CourseCard';
import RevealSection from '../components/RevealSection';
import { useInView } from '../hooks/useInView';
import { VideoIcon, PhoneIcon, InfinityIcon, TeacherIcon, ScissorsIcon, NeedleIcon, PaletteIcon, YarnIcon } from '../components/Icons';
const benefits = [
  { icon: 'video', title: 'Clases grabadas', desc: 'Accedé al contenido cuando quieras, sin horarios fijos.' },
  { icon: 'phone', title: 'Desde cualquier dispositivo', desc: 'Aprendé desde tu celular, tablet o computadora.' },
  { icon: 'infinity', title: 'Acceso de por vida', desc: 'Una vez que comprás, el curso es tuyo para siempre.' },
  { icon: 'teacher', title: 'Instructora experta', desc: 'Aprendé con Daia, diseñadora con más de 10 años de experiencia.' },
];

const categories = [
  { icon: 'scissors', label: 'Costura' },
  { icon: 'needle', label: 'Bordado' },
  { icon: 'palette', label: 'Diseño Textil' },
  { icon: 'yarn', label: 'Workshops' },
];

const delays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

export default function Home() {
  const { courses } = useCourses();
  const featured = courses.slice(0, 3);
  const [daiaRef, daiaInView] = useInView(0.2);

  return (
    <div>
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-left">
          <span className="hero-badge">Bienvenida</span>

          <h1 id="hero-title" className="title">
            CREA · COSER · CRECER
          </h1>

          <h2 className="subtitle">Aprendé técnicas prácticas con estilo propio</h2>

          <p className="lead">
            GROW combina procesos artesanales y formación online para que diseñes y confecciones con confianza.
            Cursos guiados, comunidad y proyectos reales para avanzar a tu ritmo.
          </p>

          <div className="hero-cta" role="group" aria-label="Llamados a la acción">
            <Link to="/registro" className="btn btn-primary btn-lg">Comenzar ahora</Link>
            <Link to="/cursos" className="btn btn-outline btn-lg">Ver cursos</Link>
          </div>
        </div>

        <div className="hero-right" aria-hidden="false">
          <div className="hero-image-wrap">
            <img src={encodeURI('/Images/daia.webp')} alt="Daia, fundadora de GROW" className="hero-image" />

            <div className="logo-circle" aria-hidden="true">
              <img src={encodeURI('/Images/logo-grow.webp')} alt="Logo GROW" style={{ width: '70%', height: '70%', objectFit: 'contain' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Estilo Visual */}
      <section className="visual-section" aria-labelledby="visual-title">
        <div>
          <div className="visual-icons" role="list" aria-hidden="true">
            {/* Icono 1: botón (fucsia) */}
            <div className="visual-icon pink" role="listitem" aria-label="CTA">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="3" strokeWidth="1.6" />
                <circle cx="9" cy="12" r="1.2" fill="currentColor" />
              </svg>
            </div>

            {/* Icono 2: ramita (verde) */}
            <div className="visual-icon green" role="listitem" aria-label="Orgánico">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M20 8c0 0-3.5 1-6 4s-6 6-6 6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6c2 1 3 3 4 4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Icono 3: carretel (verde) */}
            <div className="visual-icon green" role="listitem" aria-label="Carretel">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="6" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>

            {/* Icono 4: aguja (fucsia) */}
            <div className="visual-icon pink" role="listitem" aria-label="Aguja">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M3 21l12-12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 9a2 2 0 0 0-2-2l-3 3 2 2 3-3z" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            {/* Icono 5: ovillo (verde) */}
            <div className="visual-icon green" role="listitem" aria-label="Ovillo">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="12" r="6" strokeWidth="1.6" />
                <path d="M8 11c1.2-2 4-3 6-2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div className="visual-text">
          <h3 id="visual-title" className="subtitle">Estilo visual</h3>
          <p>
            GROW utiliza una estética limpia con elementos orgánicos: texturas suaves, formas circulares y una paleta que combina
            el rosa claro para fondos con un fucsia en detalles y un verde profundo como identidad. Las tipografías equilibran
            carácter (Bebas / Playfair) y legibilidad (Montserrat).
          </p>
        </div>
      </section>

      {/* Combined About section: side-by-side on md+ */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-2xl border border-[#EDE4D6] p-8">
            <RevealSection>
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F] mb-4">¿Qué es Grow?</h2>
                <p className="text-[#6B4C3B] text-base leading-relaxed mb-6">
                  GROW es un estudio creativo dedicado a la costura, el bordado y el diseño, pensado para acompañarte paso a paso en tu aprendizaje. Acá vas a encontrar clases, herramientas, inspiración y una comunidad que crece junto a vos.
                </p>
                <p className="text-[#7A9E7E] font-medium text-lg">
                  ¿Te quedás a descubrir todo lo que podrías lograr con tus propias manos?
                </p>
              </div>
            </RevealSection>
          </div>

          <div className="bg-[#F9F5F0] rounded-2xl border border-[#EDE4D6] p-8 h-full flex items-start">
            <div ref={daiaRef} className={`flex flex-col md:flex-row md:items-start gap-6 reveal ${daiaInView ? 'visible' : ''}`}>
              <div className={`w-28 h-28 rounded-full overflow-hidden flex-shrink-0 reveal-scale border border-[#EDE4D6] ${daiaInView ? 'visible' : ''}`}>
                <img src={encodeURI('/Images/daia.webp')} alt="Daia" className="w-full h-full object-cover" />
              </div>
                <div className={`reveal-right ${daiaInView ? 'visible' : ''}`}>
                <span className="text-[#7A9E7E] text-sm font-medium">¿Quién está detrás de Grow?</span>
                <h3 className="font-handmade text-2xl font-bold text-[#3D2B1F] mt-1 mb-3">Hola, soy Daia</h3>
                <p className="text-[#6B4C3B] opacity-90 leading-relaxed">
                  Diseñadora de indumentaria, diseñadora gráfica, modista y apasionada del bordado en todas sus formas. Tengo más de diez años de experiencia compartiendo lo que sé y aprendiendo siempre. En Grow no tenés que adaptarte a un sistema rígido: nosotros nos adaptamos a vos, a tu ritmo, a tus tiempos, a tus ganas de crear.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-[#F9F5F0]">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F] text-center mb-10">¿Por qué elegirnos?</h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {(() => {
              const ICON_MAP = {
                video: VideoIcon,
                phone: PhoneIcon,
                infinity: InfinityIcon,
                teacher: TeacherIcon,
                scissors: ScissorsIcon,
                needle: NeedleIcon,
                palette: PaletteIcon,
                yarn: YarnIcon,
              };
              return benefits.map((b, i) => {
                const Icon = ICON_MAP[b.icon] || VideoIcon;
                return (
                  <RevealSection key={i} animation="reveal-scale" delay={delays[i]}>
                    <div className="text-center p-6 rounded-2xl bg-white border border-[#EDE4D6] hover:border-[#7A9E7E] hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                      <div className="flex items-center justify-center mb-3">
                        <div className={`visual-icon ${i % 2 === 0 ? 'icon-outline-pink' : 'icon-outline-green'} small`} aria-hidden>
                          <Icon className="w-10 h-10" />
                        </div>
                      </div>
                      <h3 className="font-semibold text-[#3D2B1F] mb-2">{b.title}</h3>
                      <p className="text-[#A08060] text-sm">{b.desc}</p>
                    </div>
                  </RevealSection>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-[#F5EFE6]">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F] text-center mb-10">Nuestras especialidades</h2>
          </RevealSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const ICON_MAP = {
                video: VideoIcon,
                phone: PhoneIcon,
                infinity: InfinityIcon,
                teacher: TeacherIcon,
                scissors: ScissorsIcon,
                needle: NeedleIcon,
                palette: PaletteIcon,
                yarn: YarnIcon,
              };
              return categories.map((cat, i) => {
                const Icon = ICON_MAP[cat.icon] || ScissorsIcon;
                return (
                  <RevealSection key={i} animation="reveal" delay={delays[i]}>
                    <Link to="/cursos" className="block bg-white rounded-2xl p-6 text-center border border-[#EDE4D6] hover:border-[#C4785A] hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-center mb-2">
                        <div className={`visual-icon ${i % 2 === 0 ? 'icon-outline-pink' : 'icon-outline-green'} small`} aria-hidden>
                          <Icon className="w-10 h-10" />
                        </div>
                      </div>
                      <p className="font-medium text-[#3D2B1F] text-sm">{cat.label}</p>
                    </Link>
                  </RevealSection>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealSection className="flex items-center justify-between mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F]">Cursos destacados</h2>
            <Link to="/cursos" className="text-[#7A9E7E] hover:text-[#5E8262] text-sm font-medium">Ver todos →</Link>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((course, i) => (
              <RevealSection key={course.id} animation="reveal" delay={delays[i]}>
                <CourseCard course={course} />
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F] text-center mb-10">Lo que dicen nuestras alumnas</h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={t.id} animation="reveal" delay={delays[i]}>
                <div className="bg-[#F5EFE6] rounded-2xl p-6 border border-[#EDE4D6] hover:-translate-y-1 hover:shadow-sm transition-all duration-300 h-full">
                  <p className="text-[#6B4C3B] text-sm mb-4 italic leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-[#3D2B1F] text-sm">{t.name}</p>
                      <p className="text-[#A08060] text-xs">{t.course}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <RevealSection animation="reveal-scale">
        <section className="py-16 px-4 bg-[#7A9E7E]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">En Grow, siempre hay un espacio para vos</h2>
            <p className="text-[#D4E8D4] mb-8">Registrate gratis y comenzá tu primer curso hoy.</p>
            <Link to="/registro" className="bg-white text-[#5E8262] px-8 py-3.5 rounded-full font-semibold hover:bg-[#F5EFE6] hover:scale-105 transition-all duration-200">
              Empezar ahora
            </Link>
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
