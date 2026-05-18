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
        className="relative min-h-[60vh] md:min-h-[80vh] flex items-center py-12 px-4 bg-cover bg-right bg-no-repeat"
        style={{
          backgroundImage: `url(${encodeURI('/Images/hero.webp')})`,
          backgroundPosition: 'center right',
          backgroundSize: 'cover'
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0) 80%)' }}
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div>
              <div className="hero-card text-theme mx-auto md:mx-0 max-w-md">
                <span className="animate-fade-up block mx-auto text-center bg-white/95 text-[#4E6D5B] text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  ✨ Grow · Textil Creative Institute · Sídney
                </span>

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
                  <Link to="/cursos" className="btn-theme btn-hero transition-all duration-200 hover:scale-105 active:scale-95">
                    Ver cursos
                  </Link>
                  <Link to="/registro" className="btn-theme btn-hero transition-all duration-200 hover:scale-105 active:scale-95">
                    Registrarse gratis
                  </Link>
                </div>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>
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
