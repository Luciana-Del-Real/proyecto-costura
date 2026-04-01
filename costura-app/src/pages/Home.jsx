import { Link } from 'react-router-dom';
import { courses, testimonials } from '../data/courses';
import CourseCard from '../components/CourseCard';
import RevealSection from '../components/RevealSection';
import { useInView } from '../hooks/useInView';

const benefits = [
  { icon: '🎬', title: 'Clases grabadas', desc: 'Accedé al contenido cuando quieras, sin horarios fijos.' },
  { icon: '📱', title: 'Desde cualquier dispositivo', desc: 'Aprendé desde tu celular, tablet o computadora.' },
  { icon: '♾️', title: 'Acceso de por vida', desc: 'Una vez que comprás, el curso es tuyo para siempre.' },
  { icon: '👩‍🏫', title: 'Instructora experta', desc: 'Aprendé con Daia, diseñadora con más de 10 años de experiencia.' },
];

const categories = [
  { icon: '✂️', label: 'Costura' },
  { icon: '🪡', label: 'Bordado' },
  { icon: '🎨', label: 'Diseño Textil' },
  { icon: '🧶', label: 'Workshops' },
];

const delays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

export default function Home() {
  const featured = courses.filter(c => c.featured);
  const [daiaRef, daiaInView] = useInView();

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#F5EFE6] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="animate-fade-up inline-block bg-[#EAF0EA] text-[#5E8262] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            ✨ Grow · Textil Creative Institute · Sídney
          </span>
          <h1 className="animate-fade-up-delay-1 text-4xl md:text-6xl font-bold text-[#3D2B1F] mb-6 leading-tight">
            Creá con tus<br />
            <span className="text-[#7A9E7E]">propias manos</span>
          </h1>
          <p className="animate-fade-up-delay-2 text-[#6B4C3B] text-lg md:text-xl mb-4 max-w-2xl mx-auto opacity-80">
            Cursos online de costura, bordado y diseño textil para todos los niveles. A tu ritmo, con acompañamiento profesional.
          </p>
          <p className="animate-fade-up-delay-3 text-[#A08060] text-sm mb-8 max-w-xl mx-auto italic">
            "Creemos que todas las personas pueden crear, incluso si empiezan desde cero."
          </p>
          <div className="animate-fade-up-delay-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/cursos" className="bg-[#7A9E7E] text-white px-8 py-3.5 rounded-full font-semibold hover:bg-[#5E8262] hover:scale-105 active:scale-95 transition-all duration-200 text-lg">
              Ver cursos
            </Link>
            <Link to="/registro" className="bg-white text-[#7A9E7E] border border-[#7A9E7E] px-8 py-3.5 rounded-full font-semibold hover:bg-[#EAF0EA] hover:scale-105 active:scale-95 transition-all duration-200 text-lg">
              Registrarse gratis
            </Link>
          </div>
        </div>
      </section>

      {/* About Grow */}
      <section className="py-16 px-4 bg-white">
        <RevealSection className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F] mb-4">¿Qué es Grow?</h2>
          <p className="text-[#6B4C3B] text-base leading-relaxed mb-6 opacity-80">
            GROW es un estudio creativo dedicado a la costura, el bordado y el diseño, pensado para acompañarte paso a paso en tu aprendizaje. Acá vas a encontrar clases, herramientas, inspiración y una comunidad que crece junto a vos.
          </p>
          <p className="text-[#7A9E7E] font-medium text-lg">
            ¿Te quedás a descubrir todo lo que podrías lograr con tus propias manos?
          </p>
        </RevealSection>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-[#F9F5F0]">
        <div className="max-w-6xl mx-auto">
          <RevealSection>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3D2B1F] text-center mb-10">¿Por qué elegirnos?</h2>
          </RevealSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <RevealSection key={i} animation="reveal-scale" delay={delays[i]}>
                <div className="text-center p-6 rounded-2xl bg-white border border-[#EDE4D6] hover:border-[#7A9E7E] hover:-translate-y-1 hover:shadow-md transition-all duration-300 h-full">
                  <div className="text-4xl mb-3">{b.icon}</div>
                  <h3 className="font-semibold text-[#3D2B1F] mb-2">{b.title}</h3>
                  <p className="text-[#A08060] text-sm">{b.desc}</p>
                </div>
              </RevealSection>
            ))}
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
            {categories.map((cat, i) => (
              <RevealSection key={i} animation="reveal" delay={delays[i]}>
                <Link to="/cursos" className="block bg-white rounded-2xl p-6 text-center border border-[#EDE4D6] hover:border-[#C4785A] hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <p className="font-medium text-[#3D2B1F] text-sm">{cat.label}</p>
                </Link>
              </RevealSection>
            ))}
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

      {/* About Daia */}
      <section className="py-16 px-4 bg-[#F9F5F0]">
        <div
          ref={daiaRef}
          className={`max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 reveal ${daiaInView ? 'visible' : ''}`}
        >
          <div className={`w-32 h-32 rounded-full bg-[#EDE4D6] flex items-center justify-center text-6xl flex-shrink-0 reveal-scale ${daiaInView ? 'visible' : ''}`}>
            👩‍🎨
          </div>
          <div className={`reveal-right ${daiaInView ? 'visible' : ''}`}>
            <span className="text-[#7A9E7E] text-sm font-medium">¿Quién está detrás de Grow?</span>
            <h2 className="text-2xl font-bold text-[#3D2B1F] mt-1 mb-3">Hola, soy Daia</h2>
            <p className="text-[#6B4C3B] opacity-80 leading-relaxed">
              Diseñadora de indumentaria, diseñadora gráfica, modista y apasionada del bordado en todas sus formas. Tengo más de diez años de experiencia compartiendo lo que sé y aprendiendo siempre. En Grow no tenés que adaptarte a un sistema rígido: nosotros nos adaptamos a vos, a tu ritmo, a tus tiempos, a tus ganas de crear.
            </p>
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
