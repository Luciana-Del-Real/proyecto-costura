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
      <section
        className="relative min-h-[60vh] md:min-h-[80vh] flex items-center py-12 px-4 bg-cover bg-center bg-no-repeat hero-no-sep"
        style={{
          backgroundImage: "url('/Images/IMG_8373.jpg')",
          backgroundPosition: 'right center',
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
                <h2 className="text-2xl md:text-3xl font-bold text-theme mb-4">¿Qué es Grow?</h2>
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
                <h3 className="font-montserrat text-2xl font-bold text-theme mt-1 mb-3">Hola, soy Daia</h3>
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
            <h2 className="text-2xl md:text-3xl font-bold text-theme text-center mb-10">¿Por qué elegirnos?</h2>
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
                return (
                  <RevealSection key={i} animation="reveal-scale" delay={delays[i]}>
                    <div className="feature-card text-center p-6 rounded-2xl bg-white border border-theme hover:border-[#7A9E7E] hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                      <div className="flex items-center justify-center mb-3">
                        <div className={`icon-wrapper ${i % 2 === 0 ? 'icon-outline-pink' : 'icon-outline-green'}`} aria-hidden>
                          {i % 2 === 0 ? (
                            /* pink icons: video, infinity for some */
                            b.icon === 'video' ? (
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#E83E8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <rect x="2" y="5" width="20" height="14" rx="2" />
                                <polygon points="10,8 16,12 10,16" fill="#E83E8C" stroke="none" />
                              </svg>
                            ) : b.icon === 'phone' ? (
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#E83E8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <rect x="7" y="3" width="10" height="18" rx="2" />
                                <line x1="9" y1="5.5" x2="15" y2="5.5" />
                                <circle cx="12" cy="18.5" r="0.65" />
                              </svg>
                            ) : b.icon === 'infinity' ? (
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#E83E8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18.5 7.5c-1.7-1.7-4.5-1.7-6.2 0l-1.3 1.3-1.3-1.3c-1.7-1.7-4.5-1.7-6.2 0-1.7 1.7-1.7 4.5 0 6.2l1.3 1.3 6.2 6.2 6.2-6.2 1.3-1.3c1.7-1.7 1.7-4.5 0-6.2z" />
                              </svg>
                            ) : (
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#E83E8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="6" width="18" height="12" rx="2" />
                                <polygon points="9,9 15,12 9,15" fill="#E83E8C" stroke="none" />
                              </svg>
                            )
                          ) : (
                            /* green icons: scissors, needle */
                            b.icon === 'scissors' ? (
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#4E6D5B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.5 14.5l5 5" />
                                <path d="M5.5 5.5l5 5" />
                                <circle cx="6" cy="6" r="3" />
                                <circle cx="18" cy="18" r="3" />
                              </svg>
                            ) : (
                              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#4E6D5B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 4c-2 2-6 6-8 8-2 2-6 6-8 8" />
                                <path d="M14 10l6-6" />
                              </svg>
                            )
                          )}
                        </div>
                      </div>
                      <h3 className="font-semibold text-theme mb-2">{b.title}</h3>
                      <p className="text-theme text-sm">{b.desc}</p>
                    </div>
                  </RevealSection>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 bg-soft">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-theme text-center mb-10">Nuestras especialidades</h2>
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
                return (
                  <RevealSection key={i} animation="reveal" delay={delays[i]}>
                    <Link to="/cursos" className="block bg-white rounded-2xl p-6 text-center border border-theme hover:border-[#C4785A] hover:-translate-y-1 hover:shadow-md transition-all duration-300 feature-card">
                      <div className="flex items-center justify-center mb-2">
                        <div className={`icon-wrapper ${i % 2 === 0 ? 'icon-outline-pink' : 'icon-outline-green'}`} aria-hidden>
                          {cat.icon === 'scissors' ? (
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#4E6D5B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.5 14.5l5 5" />
                              <path d="M5.5 5.5l5 5" />
                              <circle cx="6" cy="6" r="3" />
                              <circle cx="18" cy="18" r="3" />
                            </svg>
                          ) : (
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#4E6D5B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 4c-2 2-6 6-8 8-2 2-6 6-8 8" />
                              <path d="M14 10l6-6" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <p className="font-medium text-theme text-sm">{cat.label}</p>
                    </Link>
                  </RevealSection>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Sección 'Cursos destacados' eliminada por pedido del equipo */}

      {/* Testimonials */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-theme text-center mb-10">Lo que dicen nuestras alumnas</h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <RevealSection key={t.id} animation="reveal" delay={delays[i]}>
                <div className="bg-soft rounded-2xl p-6 border border-theme hover:-translate-y-1 hover:shadow-sm transition-all duration-300 h-full">
                  <p className="text-theme text-sm mb-4 italic leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <p className="font-semibold text-theme text-sm">{t.name}</p>
                      <p className="text-theme text-xs">{t.course}</p>
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
        <section className="py-16 px-4 bg-secondary">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">En Grow, siempre hay un espacio para vos</h2>
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
