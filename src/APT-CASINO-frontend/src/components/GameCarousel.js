import { useState, useRef, useEffect } from "react";
import GradientBorderButton from "./GradientBorderButton";
import { Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaUsers,
  FaStar,
  FaBolt,
  FaFire,
  FaTrophy,
} from "react-icons/fa";
import HeaderText from "./HeaderText";
import GameStats from "./GameStats";

// Game data with more details
const FEATURED_GAMES = [
  {
    id: "roulette",
    title: "Roulette",
    description: "Spin the wheel and test your luck",
    image: "/images/games/roulette.png",
    path: "/game/roulette",
    players: 142,
    categories: ["featured", "table"],
    badge: "POPULAR",
    badgeColor: "from-red-500 to-orange-500",
    isNew: false,
    isHot: true,
  },
  {
    id: "fortune-tiger",
    title: "Fortune Tiger",
    description: "Win big with the lucky tiger slots",
    image: "/images/games/fortune-tiger.png",
    path: "/game/fortune-tiger",
    players: 89,
    categories: ["slots", "jackpot"],
    badge: "JACKPOT",
    badgeColor: "from-blue-500 to-purple-500",
    isNew: false,
    isHot: false,
  },
  {
    id: "poker",
    title: "Texas Hold'em",
    description: "Show your poker face and win big",
    image: "/images/games/poker.png",
    path: "/game/poker",
    players: 56,
    categories: ["card", "table"],
    badge: "NEW",
    badgeColor: "from-green-500 to-teal-500",
    isNew: true,
    isHot: false,
  },
  {
    id: "blackjack",
    title: "Blackjack",
    description: "Beat the dealer to 21 and win",
    image: "/images/games/blackjack.png",
    path: "/game/blackjack",
    players: 78,
    categories: ["card", "table", "featured"],
    badge: "FEATURED",
    badgeColor: "from-purple-500 to-pink-500",
    isNew: false,
    isHot: true,
  },
  {
    id: "crash",
    title: "Crypto Crash",
    description: "Cash out before the crash for huge wins",
    image: "/images/games/crash.png",
    path: "/game/crash",
    players: 203,
    categories: ["instant", "featured"],
    badge: "HOT",
    badgeColor: "from-red-500 to-yellow-500",
    isNew: false,
    isHot: true,
  },
];

// Available category filters
const CATEGORIES = [
  { id: "all", label: "All Games" },
  { id: "featured", label: "Featured" },
  { id: "table", label: "Table Games" },
  { id: "card", label: "Card Games" },
  { id: "slots", label: "Slots" },
  { id: "instant", label: "Instant Win" },
];

const GameCarousel = () => {
  const scrollContainerRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [visibleGames, setVisibleGames] = useState(FEATURED_GAMES);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Filter games when category changes
  useEffect(() => {
    if (activeCategory === "all") {
      setVisibleGames(FEATURED_GAMES);
    } else {
      setVisibleGames(
        FEATURED_GAMES.filter((game) =>
          game.categories.includes(activeCategory)
        )
      );
    }
  }, [activeCategory]);

  // Check if scroll arrows should be visible
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollContainerRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } =
        scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      // Initial check
      checkScroll();

      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, [visibleGames]);

  // Handle manual scrolling
  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -520, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 520, behavior: "smooth" });
    }
  };

  // Mouse drag scrolling
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Game card component
  const GameCard = ({ game }) => (
    <div className="flex-shrink-0 w-[320px] sm:w-[400px] md:w-[520px] p-0.5 magic-gradient rounded-xl h-[300px] transform transition-all hover:scale-[1.02] shadow-lg hover:shadow-xl group">
      <div className="bg-sharp-black flex p-6 md:p-8 w-full h-full rounded-xl relative overflow-hidden">
        <div className="flex flex-col justify-between z-10 w-3/5">
          {/* Game badge */}
          {game.badge && (
            <span
              className={`p-1.5 px-3 w-fit bg-gradient-to-r ${game.badgeColor} font-display text-white font-medium rounded-md flex items-center gap-1.5`}
            >
              {game.isNew && <FaBolt className="text-xs" />}
              {game.isHot && <FaFire className="text-xs" />}
              {game.badge}
            </span>
          )}

          <div className="space-y-3 mt-3">
            <h3 className="text-2xl md:text-3xl font-display font-bold text-white group-hover:text-gradient transition-all">
              {game.title}
            </h3>
            <p className="text-xs md:text-sm text-white/80">
              {game.description}
            </p>

            {/* Live player count */}
            <div className="flex items-center gap-2 text-white/70">
              <FaUsers className="text-green-500" />
              <span className="text-xs">{game.players} players online</span>
            </div>
          </div>

          <div className="w-full mt-4">
            <Link to={game.path}>
              <GradientBorderButton className="w-full">
                Play Now
              </GradientBorderButton>
            </Link>
          </div>
        </div>

        <div className="absolute -right-2 bottom-0 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
          <img
            src={game.image}
            width={220}
            height={250}
            alt={`${game.title} game`}
            className="object-contain drop-shadow-lg w-[220px] h-[250px]"
            style={{ objectFit: "contain" }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );

  return (
    <div className="pt-12 pb-6 container mx-auto px-4 relative">
      {/* Decorative elements */}
      <div className="absolute -top-40 -left-20 w-80 h-80 rounded-full bg-red-magic/5 blur-[100px] z-0"></div>
      <div className="absolute top-1/3 right-1/4 w-60 h-60 rounded-full bg-blue-magic/5 blur-[80px] z-0"></div>

      <div className="mb-12 flex flex-col md:flex-row items-center justify-between">
        <div className="text-center md:text-left md:max-w-2xl">
          <HeaderText
            header="Featured Games"
            description="Experience our premium selection of games with the highest payout rates and player counts"
          />
        </div>
        <div className="mt-6 md:mt-0">
          <GameStats />
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
              activeCategory === category.id
                ? "bg-gradient-to-r from-red-magic to-blue-magic text-white font-medium"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Carousel container with scroll controls */}
      <div className="relative">
        {/* Left scroll arrow - only shown when content is scrolled */}
        {showLeftArrow && (
          <button
            onClick={handleScrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black border border-white/20 h-10 w-10 rounded-full flex items-center justify-center"
            aria-label="Scroll left"
          >
            <FaArrowLeft className="text-white text-sm" />
          </button>
        )}

        {/* Right scroll arrow - only shown when more content is available */}
        {showRightArrow && (
          <button
            onClick={handleScrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black border border-white/20 h-10 w-10 rounded-full flex items-center justify-center"
            aria-label="Scroll right"
          >
            <FaArrowRight className="text-white text-sm" />
          </button>
        )}

        {/* Game cards container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto custom-scrollbar pb-4 pl-1 snap-x"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className="flex gap-6 mx-auto">
            {visibleGames.length > 0 ? (
              visibleGames.map((game) => (
                <div key={game.id} className="snap-start">
                  <GameCard game={game} />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center w-full py-10">
                <p className="text-white/70 text-lg">
                  No games found in this category
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dots navigation for mobile - simplified version */}
      <div className="flex gap-1.5 justify-center mt-6">
        {visibleGames.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (scrollContainerRef.current) {
                const cardWidth = 520 + 24; // Card width + gap
                scrollContainerRef.current.scrollLeft = index * cardWidth;
              }
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index ===
              Math.floor(
                (scrollContainerRef.current?.scrollLeft || 0) /
                  (scrollContainerRef.current?.clientWidth || 1)
              )
                ? "bg-white w-4"
                : "bg-white/30"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* View all games button */}
      <div className="text-center mt-10">
        <Link to="/games">
          <GradientBorderButton className="px-8">
            View All Games
          </GradientBorderButton>
        </Link>
      </div>
    </div>
  );
};

export default GameCarousel;
