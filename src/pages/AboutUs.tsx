import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Award, Target, Users, Zap, MapPin, Store, Coffee, Gamepad2, GraduationCap } from 'lucide-react';

export default function AboutUs() {
  const { t } = useTranslation();

  const achievements = [
    { year: '2013', title: '1st Best Exhibitor Retail And Distribution' },
    { year: '2014', title: 'Best Exhibitor Retail and Distribution' },
    { year: '2015', title: 'RRA Compliant Taxpayer' },
    { year: '2020', title: '1st Merchant Of The Year in Rwanda' },
  ];

  const branches = [
    'Simba Centenary', 'Simba Gishushu', 'Simba Kimironko', 'Simba Kicukiro',
    'Simba Kigali Heights', 'Simba UTC', 'Simba Gacuriro', 'Simba Gikondo',
    'Simba Sonatube', 'Simba Kisimenti', 'Simba Rebero'
  ];

  const sections = [
    {
      title: 'COMPANY PROFILE',
      content: 'SIMBA SUPERMARKET LTD offers a variety of products, including food, furniture, clothing, stationary, cosmetics, and toys. SIMBA SUPERMARKET LTD is genuinely a testament of Rwanda’s economic resurgence whose main goal is to meet people’s daily needs in Kigali, Rwanda. It was founded by Mr. Teklay Teame and his partners and now serves as the Chairman and CEO of Simba Supermarket LTD.',
      icon: Users
    },
    {
      title: 'Origin History',
      content: 'SIMBA SUPERMARKET LTD, established on December 3, 2007, as a Limited Liability Company, aims to become the region\'s largest retail outlet. Importing products from Europe, Egypt, Dubai, China, Turkey, and other countries, the company ensures a diverse product range. The official launch took place on August 8, 2008, creating over 450 jobs for Rwandese. SIMBA SUPERMARKET LTD offers a variety of products, including food, furniture, clothing, stationary, cosmetics, and toys. With branches across Rwanda, including the latest one in Kigali, the company provides services such as a butchery, bakery, and coffee shop, aiming for a one-stop shopping experience. Known for quality products at affordable prices, SIMBA SUPERMARKET LTD serves international organizations, local NGOs, private companies, and government ministries, earning a reputation as one of Rwanda\'s most admired supermarkets.',
      icon: GraduationCap
    }
  ];

  const values = [
    {
      title: 'Respect for the Individual',
      description: 'We’re hardworking, ordinary people who’ve teamed up to accomplish extraordinary things. While our backgrounds and personal beliefs are very different, we never take each other for granted. We encourage those around us to express their thoughts and ideas. We treat each other with dignity. This is the most basic way we show respect.',
      icon: Target
    },
    {
      title: 'Service to customers',
      description: 'Our customers are the reason we’re in business, so we should treat them that way. We offer quality merchandise at the lowest prices, and we do it with the best customer service possible. We look for every opportunity where we can exceed our customers’ expectations. That’s when we’re at our very best.',
      icon: Zap
    },
    {
      title: 'Striving for Excellence',
      description: 'We’re proud of our accomplishments but never satisfied. We constantly reach further to bring new ideas and goals to life. We always ask: Is this the best I can do? This demonstrates the passion we have for our business, for our customers, and for our communities.',
      icon: Award
    }
  ];

  const categories = [
    'Fruits & Vegetables', 'Meats', 'Frozen', 'Wines & Spirits', 'Furniture',
    'Electronic', 'Utensils & Ornaments', 'Homecare', 'Baby Products',
    'Gym & Sports', 'Health & Beauty', 'Bakery'
  ];

  return (
    <div className="min-h-screen pt-24 pb-20">
      {/* Hero Header */}
      <section className="max-w-7xl mx-auto px-4 mb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6"
        >
          <span className="micro-label bg-brand-primary/10 border border-brand-primary/30 px-4 py-2 rounded-full text-brand-primary italic">
            SINCE 2007
          </span>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="massive-header text-[var(--brand-text)]"
        >
          ABOUT <span className="text-brand-primary">SIMBA</span>
        </motion.h1>
      </section>

      {/* Profile & History */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="card-gradient p-8 sm:p-12"
            >
              <section.icon className="h-12 w-12 text-brand-primary mb-8" />
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 text-[var(--brand-text)]">
                {section.title}
              </h2>
              <p className="text-[var(--brand-text)] opacity-70 leading-relaxed font-bold italic uppercase tracking-tight text-sm">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Beliefs & Values */}
      <section className="bg-black/5 dark:bg-black/50 py-24 mb-32 border-y border-brand-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black italic uppercase tracking-tighter text-[var(--brand-text)]">
              BELIEFS & <span className="text-brand-primary">VALUES</span>
            </h2>
            <div className="h-1.5 w-32 bg-brand-primary mx-auto mt-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 text-center flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-3xl bg-brand-primary/10 flex items-center justify-center mb-8 border border-brand-primary/20">
                  <v.icon className="h-8 w-8 text-brand-primary" />
                </div>
                <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-4 text-[var(--brand-text)]">
                  {v.title}
                </h3>
                <p className="text-xs font-bold uppercase tracking-tight opacity-50 leading-loose">
                  {v.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Detail Sections */}
      <div className="max-w-7xl mx-auto px-4 mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          {/* Categories */}
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-[var(--brand-text)] border-l-4 border-brand-primary pl-6">
              PRODUCT CATEGORIES
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((c, i) => (
                <span key={i} className="px-4 py-2 bg-black/5 dark:bg-white/5 border border-brand-border rounded-full text-[10px] font-black uppercase tracking-widest text-[var(--brand-text)] opacity-60">
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-[var(--brand-text)] border-l-4 border-brand-primary pl-6">
              ACHIEVEMENTS
            </h2>
            <div className="space-y-6">
              {achievements.map((a, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="text-brand-primary font-black italic text-xl tracking-tighter">{a.year}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[var(--brand-text)] opacity-60 mt-1">{a.title}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Branches */}
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-[var(--brand-text)] border-l-4 border-brand-primary pl-6">
              BRANCHES
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {branches.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-text)] opacity-50 hover:text-brand-primary transition-colors cursor-default">
                  <MapPin className="h-3 w-3 text-brand-primary" />
                  {b}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Services Detail */}
      <section className="max-w-7xl mx-auto px-4 mb-32">
        <div className="text-left mb-16 px-6 border-l-8 border-brand-primary">
          <h2 className="text-6xl sm:text-7xl font-black italic uppercase tracking-tighter text-[var(--brand-text)] leading-none">
            SERVICES <span className="text-brand-primary">DETAIL</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ServiceCard 
            icon={Store}
            title="Supermarket Service"
            desc="11 Branches already in Operation across Rwanda."
          />
          <ServiceCard 
            icon={Coffee}
            title="Restaurant & Coffee Shop"
            desc="Trucillo Cafe services at five major Simba Branches."
          />
          <ServiceCard 
            icon={Gamepad2}
            title="SIMBA ARCADE"
            desc="Arcade Games entertainment at our Gacuriro branch."
          />
          <ServiceCard 
            icon={Zap}
            title="Online Sales"
            desc="Extending our services to the door of our customers."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4">
         <div className="bg-brand-primary p-12 sm:p-20 rounded-[50px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-20 opacity-10 group-hover:scale-110 transition-transform duration-700">
               <Store className="h-64 w-64" />
            </div>
            <div className="relative z-10 max-w-2xl">
               <h2 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter text-white mb-8">
                  SIMBA IS <br/>EVERYWHERE.
               </h2>
               <p className="text-white/80 font-bold uppercase tracking-widest italic mb-12 text-sm leading-relaxed">
                  Join the testament of Rwanda's economic resurgence. We are constanty bringing new ideas and goals to life.
               </p>
               <button className="bg-white text-brand-primary px-12 py-5 rounded-full font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs italic">
                  CONTACT US
               </button>
            </div>
         </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="card-gradient p-8"
    >
      <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="h-6 w-6 text-brand-primary" />
      </div>
      <h3 className="text-lg font-black uppercase italic tracking-tighter mb-4 text-[var(--brand-text)]">
        {title}
      </h3>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  );
}
