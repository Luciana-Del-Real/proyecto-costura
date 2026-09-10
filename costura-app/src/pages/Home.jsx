import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, Smartphone, Infinity as InfinityIcon, GraduationCap, Scissors, Feather, Palette, Shirt, CalendarDays, ShoppingBag } from 'lucide-react';
import { testimonials } from '../data/courses';
import CourseCard from '../components/CourseCard';
import RevealSection from '../components/RevealSection';
import TestimonialCard from '../components/TestimonialCard';
import { useInView } from '../hooks/useInView';
const benefits = [
  { Icon: Video, titleKey: 'home.benefits.items.recorded.title', descKey: 'home.benefits.items.recorded.desc' },
  { Icon: Smartphone, titleKey: 'home.benefits.items.devices.title', descKey: 'home.benefits.items.devices.desc' },
  { Icon: InfinityIcon, titleKey: 'home.benefits.items.lifetime.title', descKey: 'home.benefits.items.lifetime.desc' },
  { Icon: GraduationCap, titleKey: 'home.benefits.items.expert.title', descKey: 'home.benefits.items.expert.desc' },
];

const categories = [
  { Icon: Scissors, labelKey: 'home.categories.items.sewing' },
  { Icon: Feather, labelKey: 'home.categories.items.embroidery' },
  { Icon: Palette, labelKey: 'home.categories.items.textileDesign' },
  { Icon: Shirt, labelKey: 'home.categories.items.workshops' },
  { Icon: CalendarDays, labelKey: 'home.categories.items.events' },
  { Icon: ShoppingBag, labelKey: 'home.categories.items.productsServices' },
];

const delays = ['', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];


export default function Home() {
  const { t } = useTranslation();
  const [daiaRef, daiaInView] = useInView(0.2);

  // Testimonials are static data (data/courses.js). Names stay as-is; the
  // quote and its source line are localized here so the landing shell is fully
  // translated without touching the shared data module.
  const localizedTestimonials = testimonials.map((testimonial) => ({
    ...testimonial,
    text: t(`home.testimonials.items.${testimonial.id}.text`, { defaultValue: testimonial.text }),
    course: t(`home.testimonials.items.${testimonial.id}.course`, { defaultValue: testimonial.course }),
  }));

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
                {t('home.hero.titleLine1')}<br />
                <span className="font-display" style={{ color: 'var(--accent)' }}>{t('home.hero.titleHighlight')}</span>
              </h1>
              <p className="font-body animate-fade-up-delay-2 text-base md:text-lg mb-4 max-w-xl md:mx-0 opacity-95">
                {t('home.hero.subtitle')}
              </p>
              <p className="font-dancing animate-fade-up-delay-3 text-xl md:text-2xl mb-6 max-w-lg md:mx-0 opacity-90">
                "{t('home.hero.quote')}"
              </p>
              <div className="animate-fade-up-delay-4 actions">
                <Link to="/cursos" className="btn btn-primary btn-hero transition-all duration-200 hover:scale-105 active:scale-95">{t('home.hero.ctaCourses')}</Link>
                <Link to="/registro" className="btn btn-primary btn-hero transition-all duration-200 hover:scale-105 active:scale-95">{t('home.hero.ctaRegister')}</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Combined About section: side-by-side on md+ */}
      <section className="bg-white py-16 px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card-glow rounded-2xl p-8 h-full flex items-center">
              <RevealSection animation="reveal-left">
                <div className="w-full flex flex-col items-center text-center">
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary shadow-[0_0_20px_rgba(232,62,140,0.30)] mb-5">
                    <img
                      src="/Images/IMG_6837_circle.jpg"
                      alt={t('home.aboutUs.imageAlt')}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Images/IMG_6837_circle.jpg'; }}
                    />
                  </div>
                  <span className="text-primary font-medium text-lg block text-center">{t('home.aboutUs.eyebrow')}</span>
                  <h3 className="font-display text-4xl font-bold text-text-ink mt-1 mb-3 text-center">{t('home.aboutUs.title')}</h3>
                  <p className="text-text-ink opacity-90 leading-relaxed text-center">
                    {t('home.aboutUs.body')}
                  </p>
                  <p className="text-primary font-medium text-lg mt-3">
                    {t('home.aboutUs.question')}
                  </p>
                </div>
              </RevealSection>
            </div>

            <div className="card-glow rounded-2xl p-8 h-full flex items-center">
              <div ref={daiaRef} className={`w-full`}>
                <div className={`mb-5 flex justify-center reveal-right ${daiaInView ? 'visible' : ''}`}>
                  <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-primary shadow-[0_0_20px_rgba(232,62,140,0.30)]">
                    <img
                      src="/Images/IMG_7148_circle.jpg"
                      alt={t('home.daia.imageAlt')}
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/Images/IMG_7148_circle.jpg'; }}
                    />
                  </div>
                </div>
                <div className={`reveal-right ${daiaInView ? 'visible' : ''}`}>
                  <span className="text-primary font-medium text-lg block text-center">{t('home.daia.eyebrow')}</span>
                  <h3 className="font-display text-4xl font-bold text-text-ink mt-1 mb-3 text-center">{t('home.daia.title')}</h3>
                  <p className="text-text-ink opacity-90 leading-relaxed text-center">
                    {t('home.daia.body')}
                  </p>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-10 px-4">
          <RevealSection>
            <h2 className="font-display font-bold text-4xl text-text-ink text-center mb-10">{t('home.benefits.title')}</h2>
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
                  <p className="font-body text-text-ink text-lg font-bold mb-2 leading-tight">{t(b.titleKey)}</p>
                  <p className="font-body text-text-ink text-sm leading-relaxed">{t(b.descKey)}</p>
                </div>
              </RevealSection>
            ))}
          </div>
      </section>

      <div className="seam-divider" aria-hidden="true" />

      {/* Categories */}
      <section className="bg-white py-10 px-4">
          <RevealSection>
            <h2 className="font-display font-bold text-4xl text-text-ink text-center mb-10">{t('home.categories.title')}</h2>
          </RevealSection>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {categories.map((cat, i) => (
              <RevealSection key={i} animation="reveal" delay={delays[i]}>
                <div className="card-glow feature-card rounded-2xl p-4 md:p-6 text-center h-full cursor-default" aria-disabled="true">
                  <div className="flex items-center justify-center mb-2">
                    <div className="icon-wrapper" aria-hidden>
                      <cat.Icon className="specialty-icon" color="var(--color-accent)" aria-hidden />
                    </div>
                  </div>
                  <p className="font-body text-text-ink text-base md:text-lg font-bold mb-2 leading-tight">{t(cat.labelKey)}</p>
                </div>
              </RevealSection>
            ))}
          </div>
      </section>

      <div className="seam-divider" aria-hidden="true" />

      {/* Testimonials */}
      <section className="py-10 px-4">
          <RevealSection>
            <h2 className="font-display font-bold text-4xl text-text-ink text-center mb-10">{t('home.testimonials.title')}</h2>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {localizedTestimonials.map((testimonial, i) => (
              <RevealSection key={testimonial.id} animation="reveal" delay={delays[i]} className="h-full">
                <TestimonialCard testimonial={testimonial} />
              </RevealSection>
            ))}
          </div>
      </section>

      <div className="seam-divider" aria-hidden="true" />

      {/* CTA */}
      <section className="bg-white py-10 px-4">
        <RevealSection animation="reveal-scale">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display font-bold text-4xl text-text-ink mb-4">{t('home.cta.title')}</h2>
              <p className="text-text-ink mb-8">{t('home.cta.body')}</p>
              <Link to="/registro" className="btn btn-primary btn-hero transition-all duration-200 hover:scale-105 active:scale-95">
                {t('home.cta.button')}
              </Link>
            </div>
        </RevealSection>
      </section>
    </div>
  );
}
