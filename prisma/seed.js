import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 9 статей на тему рок-музыки
const rockArticles = [
  {
    title: 'Эволюция Гранжа: От Сиэтла до Мирового Господства',
    content: 'Гранж, возникший в Сиэтле в конце 80-х, стал ответом на глянцевый арена-рок. Nirvana, Pearl Jam и Soundgarden не просто играли музыку; они выражали разочарование поколения.',
    excerpt: 'Краткий обзор самого влиятельного жанра 90-х.',
    slug: 'evoluciya-granzha',
    image: '/uploads/grunge_evolution.jpg',
    status: 'published',
  },
  {
    title: 'Queen: Как Оперный Рок Изменил Музыку',
    content: 'Слияние театральной драмы, оперного вокала Фредди Меркьюри и гитарных экспериментов Брайана Мэя сделало Queen одной из самых уникальных и долговечных групп в истории.',
    excerpt: 'Анализ самого знаменитого британского квартета.',
    slug: 'queen-operniy-rok',
    image: '/uploads/queen_opera.jpg',
    status: 'published',
  },
  {
    title: '10 Лучших Риффов Black Sabbath: Основа Хэви-метала',
    content: 'Тяжелые, медленные и мрачные риффы Тони Айомми не просто определили звук Black Sabbath, они создали фундамент для всего жанра хэви-метал.',
    excerpt: 'Подробный разбор культовых гитарных партий.',
    slug: 'black-sabbath-riffs',
    image: '/uploads/sabbath_riffs.jpg',
    status: 'published',
  },
  {
    title: 'Панк-рок: От Протеста до Коммерции',
    content: 'Панк, зародившийся как протестное движение в середине 70-х, с его агрессией и тремя аккордами, быстро вышел за рамки андерграунда. Ramones, Sex Pistols и The Clash.',
    excerpt: 'Краткая история панк-движения.',
    slug: 'punk-rock-protest',
    image: '/uploads/punk_history.jpg',
    status: 'published',
  },
  {
    title: 'Эпоха Металла: Расцвет и Падение Hair Metal',
    content: 'В 80-х царил глэм-метал с его яркими прическами, косметикой и гитарными соло. Motley Crue и Bon Jovi доминировали до тех пор, пока их не сместил гранж.',
    excerpt: 'Исследование феномена глэм-метала 80-х.',
    slug: 'hair-metal-padenie',
    image: '/uploads/hair_metal.jpg',
    status: 'published',
  },
  {
    title: 'Психоделический Рок 60-х: Путешествие в Звук',
    content: 'Влияние ЛСД, индийской музыки и студийных экспериментов привело к появлению психоделического рока. Pink Floyd, The Doors и Jimi Hendrix.',
    excerpt: 'Как рок-музыка стала искусством.',
    slug: 'psyho-rok-60',
    image: '/uploads/psychedelic_60s.jpg',
    status: 'published',
  },
  {
    title: 'Роль Басиста в Рок-Трио',
    content: 'В составе, где всего три инструмента, басист (например, Гедди Ли из Rush или Лес Клейпул из Primus) несет огромную ответственность за мелодию и ритм.',
    excerpt: 'О недооцененных героях рока.',
    slug: 'rol-basista',
    image: '/uploads/bass_trio.jpg',
    status: 'published',
  },
  {
    title: 'Прог-рок: Архитектура Сложного Звука',
    content: 'Прогрессивный рок конца 60-х и 70-х годов с его многочастными композициями, оркестровыми аранжировками и концептуальными альбомами (Yes, Genesis).',
    excerpt: 'Разбор самых длинных композиций в истории рока.',
    slug: 'prog-rok-arhitektura',
    image: '/uploads/prog_rock.jpg',
    status: 'published',
  },
  {
    title: 'Возрождение Гаражного Рока в 2000-х',
    content: 'После доминирования поп-панка в 90-х, The Strokes, The White Stripes и Kings of Leon вернули моду на сырое, минималистичное звучание гаражного рока.',
    excerpt: 'Новое тысячелетие и возвращение к корням.',
    slug: 'garazhniy-rok-2000',
    image: '/uploads/garage_revival.jpg',
    status: 'published',
  },
];

async function main() {
  console.log('Начало сидинга...');

  // 1. Очищаем существующие статьи (удаляем все записи)
  await prisma.article.deleteMany({});
  console.log('Существующие статьи удалены.');

  // 2. СБРОС СЧЕТЧИКА AUTO_INCREMENT
  // Это критически важно для MySQL после deleteMany/deleteAll
  await prisma.$queryRaw`ALTER TABLE articles AUTO_INCREMENT = 1;`;
  console.log('Счетчик AUTO_INCREMENT сброшен.');
  
  // Добавляем все статьи
  const { count } = await prisma.article.createMany({
    data: rockArticles,
    // skipDuplicates: true, // Пропускать, если запись с таким же slug уже есть
  });
  
  console.log(`Сидинг завершен. Добавлено ${count} статей.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
