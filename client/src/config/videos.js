/**
 * Video Pool Configuration
 *
 * Videos organized by query/topic with embedded comprehension questions.
 * Each video has 3 questions (beginning, middle, end) for time-based sampling.
 *
 * Structure:
 * - id: Unique identifier for the video
 * - title: Display title for the video (shown in UI and sent to model)
 * - videoId: YouTube video ID
 * - url: Full YouTube URL
 * - duration: Duration in seconds
 * - lengthCategory: "short" (< 1 min) or "long" (1-5 min)
 * - thumbnail: Auto-generated YouTube thumbnail
 * - questions: Array of 3 questions with timeBucket metadata
 */

/**
 * Helper function to generate YouTube thumbnail URL from video ID
 */
function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

// ===========================================
// VIDEO POOL
// ===========================================

export const videoPool = {
  "louvre-robbery-2025": [
    // SHORT VIDEOS (< 1 min)
    {
      id: "louvre_short_001",
      title: "Louvre heist masterminds' escape caught on camera",
      videoId: "xHC1hq7XDjY",
      url: "https://www.youtube.com/shorts/xHC1hq7XDjY",
      duration: 58,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("xHC1hq7XDjY"),
      questions: [
        {
          id: "q_xHC1hq7XDjY_beginning",
          text: "In which gallery did the thieves force their way in?",
          answer: "Apollo gallery",
          timeBucket: "beginning",
          answerStart: 19,
          answerEnd: 25,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_xHC1hq7XDjY_middle",
          text: "On which floor did the robbery happen?",
          answer: "First floor",
          timeBucket: "middle",
          answerStart: 26,
          answerEnd: 31,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_xHC1hq7XDjY_end",
          text: "What did the thieves drop?",
          answer: "Empress Eugenie's diadem",
          timeBucket: "end",
          answerStart: 40,
          answerEnd: 44,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "louvre_short_002",
      title: "What footage of crime scene reveals about Louvre heist",
      videoId: "4UFMKaLg-Fg",
      url: "https://www.youtube.com/shorts/4UFMKaLg-Fg",
      duration: 54,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("4UFMKaLg-Fg"),
      questions: [
        {
          id: "q_4UFMKaLg-Fg_beginning",
          text: "Which side of the Louvre did they enter from?",
          answer: "Seine-facing side",
          timeBucket: "beginning",
          answerStart: 10,
          answerEnd: 12,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_4UFMKaLg-Fg_middle",
          text: "What may be used together with an angle grinder?",
          answer: "A blowtorch",
          timeBucket: "middle",
          answerStart: 33,
          answerEnd: 36,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_4UFMKaLg-Fg_end",
          text: "What is the open investigation about?",
          answer: "Aggravated theft and criminal conspiracy",
          timeBucket: "end",
          answerStart: 48,
          answerEnd: 50,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "louvre_short_003",
      title: "What to know about the suspects in the Louvre heist",
      videoId: "IO8JgFMz6e0",
      url: "https://www.youtube.com/shorts/IO8JgFMz6e0",
      duration: 45,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("IO8JgFMz6e0"),
      questions: [
        {
          id: "q_IO8JgFMz6e0_beginning",
          text: "How many suspects have been handed preliminary charges?",
          answer: "Four",
          timeBucket: "beginning",
          answerStart: 3,
          answerEnd: 5,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_IO8JgFMz6e0_middle",
          text: "How long after the heist was the first suspect arrested?",
          answer: "Six days",
          timeBucket: "middle",
          answerStart: 25,
          answerEnd: 28,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_IO8JgFMz6e0_end",
          text: "How old is the man who arrived at the Louvre with a lift truck?",
          answer: "37",
          timeBucket: "end",
          answerStart: 39,
          answerEnd: 41,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },

    // LONG VIDEOS (1-5 min)
    {
      id: "louvre_long_001",
      title: "How the Louvre Jewelry Heist Unfolded",
      videoId: "xLf1EneAyLQ",
      url: "https://www.youtube.com/shorts/xLf1EneAyLQ",
      duration: 125,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("xLf1EneAyLQ"),
      questions: [
        {
          id: "q_xLf1EneAyLQ_beginning",
          text: "How long after the museum opened did the heist happen?",
          answer: "30 min",
          timeBucket: "beginning",
          answerStart: 0,
          answerEnd: 2,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_xLf1EneAyLQ_middle",
          text: "What percentage of the rooms have security cameras?",
          answer: "75%",
          timeBucket: "middle",
          answerStart: 59,
          answerEnd: 62,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_xLf1EneAyLQ_end",
          text: "What was the Louvre before being a museum?",
          answer: "A palace",
          timeBucket: "end",
          answerStart: 111,
          answerEnd: 113,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "louvre_long_002",
      title: "Paris Louvre heist: Video shows jewel thieves escaping • FRANCE 24 English",
      videoId: "h4Adz7ydeno",
      url: "https://www.youtube.com/watch?v=h4Adz7ydeno",
      duration: 151,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("h4Adz7ydeno"),
      questions: [
        {
          id: "q_h4Adz7ydeno_beginning",
          text: "How did the two thieves make their way down?",
          answer: "With a boom lift",
          timeBucket: "beginning",
          answerStart: 8,
          answerEnd: 11,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_h4Adz7ydeno_middle",
          text: "How long did it take the security guards to realize that it was a robbery?",
          answer: "Simultaneously/Immediately",
          timeBucket: "middle",
          answerStart: 48,
          answerEnd: 51,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_h4Adz7ydeno_end",
          text: "Why did the two security guards back away?",
          answer: "They were afraid that the thieves might be armed",
          timeBucket: "end",
          answerStart: 107,
          answerEnd: 111,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "louvre_long_003",
      title: "Louvre Heist: How Thieves Stole ‘Priceless’ Jewels in Broad Daylight | WSJ",
      videoId: "SASDkIQjouI",
      url: "https://www.youtube.com/watch?v=SASDkIQjouI",
      duration: 122,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("SASDkIQjouI"),
      questions: [
        {
          id: "q_SASDkIQjouI_beginning",
          text: "In which gallery did the robbery take place?",
          answer: "The Galeries D'Apollon (Apollo Gallery)",
          timeBucket: "beginning",
          answerStart: 15,
          answerEnd: 18,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_SASDkIQjouI_middle",
          text: "When was Leonardo da Vinci's Mona Lisa stolen?",
          answer: "1911",
          timeBucket: "middle",
          answerStart: 74,
          answerEnd: 79,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_SASDkIQjouI_end",
          text: "Since the stolen pieces would be hard to sell, what could happen to them?",
          answer: "Could be dismantled",
          timeBucket: "end",
          answerStart: 111,
          answerEnd: 115,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    }
  ],
  "olympics": [
    // SHORT VIDEOS (< 1 min)
    {
      id: "olympics_short_001",
      title: "Olympic Rings and Paris 2024",
      videoId: "sUgqH1IXQQw",
      url: "https://www.youtube.com/watch?v=sUgqH1IXQQw",
      duration: 59,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("sUgqH1IXQQw"),
      questions: [
        {
          id: "q_sUgqH1IXQQw_beginning",
          text: "What does the interlinking of the Olympic rings represent?",
          answer: "International cooperation",
          timeBucket: "beginning",
          answerStart: 8,
          answerEnd: 12,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_sUgqH1IXQQw_middle",
          text: "On which famous mountain has the 2024 Olympic torch traveled?",
          answer: "Mount Everest",
          timeBucket: "middle",
          answerStart: 37,
          answerEnd: 39,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_sUgqH1IXQQw_end",
          text: "How many times did Paris host the Olympics?",
          answer: "3",
          timeBucket: "end",
          answerStart: 56,
          answerEnd: 58,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "olympics_short_002",
      title: "History of the Olympics",
      videoId: "TTLCPcZilfM",
      url: "https://www.youtube.com/watch?v=TTLCPcZilfM",
      duration: 54,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("TTLCPcZilfM"),
      questions: [
        {
          id: "q_TTLCPcZilfM_beginning",
          text: "Who were the ancient Olympic Games dedicated to?",
          answer: "God Zeus",
          timeBucket: "beginning",
          answerStart: 13,
          answerEnd: 15,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_TTLCPcZilfM_middle",
          text: "Who founded the modern Olympic Games?",
          answer: "Baron Pierre de Coubertin",
          timeBucket: "middle",
          answerStart: 18,
          answerEnd: 21,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_TTLCPcZilfM_end",
          text: "How many times have the Olympic Games been canceled?",
          answer: "3",
          timeBucket: "end",
          answerStart: 48,
          answerEnd: 51,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "olympics_short_003",
      title: "Olympic Firsts and Facts",
      videoId: "sy7lGjteyRc",
      url: "https://www.youtube.com/shorts/sy7lGjteyRc",
      duration: 59,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("sy7lGjteyRc"),
      questions: [
        {
          id: "q_sy7lGjteyRc_beginning",
          text: "Who was allowed to participate in the first recorded Olympic Games?",
          answer: "freeborn Greek men",
          timeBucket: "beginning",
          answerStart: 10,
          answerEnd: 12,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_sy7lGjteyRc_middle",
          text: "When was the Olympic flame relay introduced?",
          answer: "1936 Berlin games",
          timeBucket: "middle",
          answerStart: 27,
          answerEnd: 32,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_sy7lGjteyRc_end",
          text: "How many runners finished the 1904 Olympic marathon?",
          answer: "14",
          timeBucket: "end",
          answerStart: 55,
          answerEnd: 58,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    // LONG VIDEOS (1-5 min)
    {
      id: "olympics_long_001",
      title: "Ancient vs Modern Olympics",
      videoId: "VdHHus8IgYA",
      url: "https://www.youtube.com/watch?v=VdHHus8IgYA",
      duration: 209,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("VdHHus8IgYA"),
      questions: [
        {
          id: "q_VdHHus8IgYA_beginning",
          text: "What does “olympiads” indicate in ancient Greek?",
          answer: "4 years increment",
          timeBucket: "beginning",
          answerStart: 33,
          answerEnd: 36,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_VdHHus8IgYA_middle",
          text: "What is the name of the 776 BC champion?",
          answer: "Coroebus",
          timeBucket: "middle",
          answerStart: 111,
          answerEnd: 116,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_VdHHus8IgYA_end",
          text: "Where did the 1896 olympics take place?",
          answer: "Athens",
          timeBucket: "end",
          answerStart: 157,
          answerEnd: 163,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "olympics_long_002",
      title: "Olympic Medals and Broadcasts",
      videoId: "fOyO6l75GU8",
      url: "https://www.youtube.com/watch?v=fOyO6l75GU8",
      duration: 190,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("fOyO6l75GU8"),
      questions: [
        {
          id: "q_fOyO6l75GU8_beginning",
          text: "When was the last solid gold medal handed out?",
          answer: "1912",
          timeBucket: "beginning",
          answerStart: 22,
          answerEnd: 25,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_fOyO6l75GU8_middle",
          text: "When were the Olympics broadcast on television for the first time?",
          answer: "1936",
          timeBucket: "middle",
          answerStart: 83,
          answerEnd: 86,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_fOyO6l75GU8_end",
          text: "How many Olympics got cancelled because of World Was 2?",
          answer: "2",
          timeBucket: "end",
          answerStart: 145,
          answerEnd: 148,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "olympics_long_003",
      title: "Winter Olympics and Records",
      videoId: "zZkunt4BLEk",
      url: "https://www.youtube.com/watch?v=zZkunt4BLEk",
      duration: 88,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("zZkunt4BLEk"),
      questions: [
        {
          id: "q_zZkunt4BLEk_beginning",
          text: "How many countries won medals in the first olympic winter games in 1924?",
          answer: "11 countries",
          timeBucket: "beginning",
          answerStart: 11,
          answerEnd: 13,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_zZkunt4BLEk_middle",
          text: "What happened to the torch for the first time in Sochi 2014?",
          answer: "It went into space.",
          timeBucket: "middle",
          answerStart: 40,
          answerEnd: 43,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_zZkunt4BLEk_end",
          text: "Who was the first person to win 10 olympic medals?",
          answer: "Raisa Smetanina.",
          timeBucket: "end",
          answerStart: 57,
          answerEnd: 59,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    }
  ],
  "titan-submarine-implosion": [
    // SHORT VIDEOS (< 1 min)
    {
      id: "titan_short_001",
      title: "Titan Submarine: Timeline of the Implosion",
      videoId: "6DEqpCajJR8",
      url: "https://www.youtube.com/shorts/6DEqpCajJR8",
      duration: 32,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("6DEqpCajJR8"),
      questions: [
        {
          id: "q_6DEqpCajJR8_beginning",
          text: "How many passengers were in the Titan submarine?",
          answer: "5",
          timeBucket: "beginning",
          answerStart: 1,
          answerEnd: 3,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_6DEqpCajJR8_middle",
          text: "How many seconds does it take our brain to process pain?",
          answer: "100 milliseconds",
          timeBucket: "middle",
          answerStart: 13,
          answerEnd: 16,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_6DEqpCajJR8_end",
          text: "How many milliseconds did it take for Titan to implode?",
          answer: "1 millisecond",
          timeBucket: "end",
          answerStart: 24,
          answerEnd: 28,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "titan_short_002",
      title: "Titan Submersible: Key Facts and Figures",
      videoId: "AtQSd2NyZk0",
      url: "https://www.youtube.com/shorts/AtQSd2NyZk0",
      duration: 59,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("AtQSd2NyZk0"),
      questions: [
        {
          id: "q_AtQSd2NyZk0_beginning",
          text: "After how much time in the water did Titan loose connection with the mother ship?",
          answer: "1hr 45 minutes",
          timeBucket: "beginning",
          answerStart: 10,
          answerEnd: 14,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_AtQSd2NyZk0_middle",
          text: "How big was the water pressure at the depth of 3,500 meter?",
          answer: "351 kilograms per square centimeter",
          timeBucket: "middle",
          answerStart: 23,
          answerEnd: 26,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_AtQSd2NyZk0_end",
          text: "When was debris from the wreckage collected?",
          answer: "June 28",
          timeBucket: "end",
          answerStart: 51,
          answerEnd: 54,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "titan_short_003",
      title: "US Coast Guard Report on Titan Submarine",
      videoId: "IeDqtdhX5IM",
      url: "https://www.youtube.com/shorts/IeDqtdhX5IM",
      duration: 67,
      lengthCategory: "short",
      thumbnail: getYouTubeThumbnail("IeDqtdhX5IM"),
      questions: [
        {
          id: "q_IeDqtdhX5IM_beginning",
          text: "How is the US Coast Guard Report framing the loss of the Titan submarine?",
          answer: "A preventable disaster",
          timeBucket: "beginning",
          answerStart: 0,
          answerEnd: 6,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_IeDqtdhX5IM_middle",
          text: "What did the board of the report determine as the primary contributing factors to the disaster?",
          answer: "Inadequate design, certification, maintenance, and inspection process",
          timeBucket: "middle",
          answerStart: 15,
          answerEnd: 31,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_IeDqtdhX5IM_end",
          text: "What did Oceangate do following the safety issues with the Titans hull after the incident in 2022, where a loud banging was heard?",
          answer: "They didn’t do anything",
          timeBucket: "end",
          answerStart: 32,
          answerEnd: 42,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    // LONG VIDEOS (1-5 min)
    {
      id: "titan_long_001",
      title: "The Titan Submersible: What Went Wrong?",
      videoId: "w9Q5WrRkefg",
      url: "https://www.youtube.com/watch?v=w9Q5WrRkefg",
      duration: 196,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("w9Q5WrRkefg"),
      questions: [
        {
          id: "q_w9Q5WrRkefg_beginning",
          text: "What was the Titan made up of?",
          answer: "carbon fiber",
          timeBucket: "beginning",
          answerStart: 34,
          answerEnd: 38,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_w9Q5WrRkefg_middle",
          text: "Who was terrified to get into the submarine?",
          answer: "Suleiman Dawood",
          timeBucket: "middle",
          answerStart: 93,
          answerEnd: 98,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_w9Q5WrRkefg_end",
          text: "What lawsuits are likely to be successful?",
          answer: "wrongful death and negligence",
          timeBucket: "end",
          answerStart: 167,
          answerEnd: 171,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "titan_long_002",
      title: "James Cameron on Titan Submersible Disaster",
      videoId: "LEBCc-Qpilw",
      url: "https://www.youtube.com/watch?v=LEBCc-Qpilw",
      duration: 217,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("LEBCc-Qpilw"),
      questions: [
        {
          id: "q_LEBCc-Qpilw_beginning",
          text: "Who asked Cameron to go diving?",
          answer: "Stockton Rush",
          timeBucket: "beginning",
          answerStart: 13,
          answerEnd: 16,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_LEBCc-Qpilw_middle",
          text: "How much time did it take to get confirmation about the loud bang?",
          answer: "one hour",
          timeBucket: "middle",
          answerStart: 103,
          answerEnd: 108,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_LEBCc-Qpilw_end",
          text: "What is progressive failure over time with microscopic water ingress and fatigue called?",
          answer: "cycling fatigue",
          timeBucket: "end",
          answerStart: 194,
          answerEnd: 197,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    },
    {
      id: "titan_long_003",
      title: "Inside the Titan Submersible",
      videoId: "pIeaCQPn53Y",
      url: "https://www.youtube.com/watch?v=pIeaCQPn53Y",
      duration: 169,
      lengthCategory: "long",
      thumbnail: getYouTubeThumbnail("pIeaCQPn53Y"),
      questions: [
        {
          id: "q_pIeaCQPn53Y_beginning",
          text: "What is Brian's job?",
          answer: "director of photography",
          timeBucket: "beginning",
          answerStart: 18,
          answerEnd: 20,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_pIeaCQPn53Y_middle",
          text: "What was the only way to get in or out the Titan?",
          answer: "through the front",
          timeBucket: "middle",
          answerStart: 107,
          answerEnd: 110,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        },
        {
          id: "q_pIeaCQPn53Y_end",
          text: "How many bolts go around the door?",
          answer: "four",
          timeBucket: "end",
          answerStart: 126,
          answerEnd: 129,
          type: "text",
          placeholder: "Enter your answer",
          maxLength: 200
        }
      ]
    }
  ]
};

// ===========================================
// TOPIC METADATA
// ===========================================

export const topicMetadata = {
  "louvre-robbery-2025": {
    title: "The Louvre Robbery (2025)",
    description: "On January 27, 2025, a major robbery occurred at the Louvre Museum in Paris. Thieves stole priceless jewels from the 19th century. The investigation is ongoing."
  },
  "olympics": {
    title: "Olympics",
    description: "Coverage and highlights from the Olympic Games, including historical context, records, and specific events."
  },
  "titan-submarine-implosion": {
    title: "Titan Submarine Implosion",
    description: "Coverage of the Titan submersible implosion incident, including the timeline, causes, and aftermath."
  }
};

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get metadata for a specific topic
 * @param {string} topic - Topic name
 * @returns {Object} Metadata object (title, description)
 */
export function getTopicMetadata(topic) {
  return topicMetadata[topic] || { title: topic, description: "" };
}

/**
 * Get all videos for a specific query/topic
 * @param {string} topic - Topic name (e.g., "louvre-robbery-2025")
 * @returns {Array} Array of video objects
 */
export function getVideosByTopic(topic) {
  return videoPool[topic] || [];
}

/**
 * Get videos by topic and length category
 * @param {string} topic - Topic name
 * @param {string} lengthCategory - "short" or "long"
 * @returns {Array} Filtered array of video objects
 */
export function getVideosByLength(topic, lengthCategory) {
  const videos = videoPool[topic] || [];
  return videos.filter(video => video.lengthCategory === lengthCategory);
}

/**
 * Get a single video by ID
 * @param {string} videoId - Video ID
 * @returns {Object|null} Video object or null if not found
 */
export function getVideoById(videoId) {
  for (const topic in videoPool) {
    const video = videoPool[topic].find(v => v.id === videoId);
    if (video) return video;
  }
  return null;
}

/**
 * Get all videos across all topics
 * @returns {Array} Array of all video objects
 */
export function getAllVideos() {
  const allVideos = [];
  for (const topic in videoPool) {
    allVideos.push(...videoPool[topic]);
  }
  return allVideos;
}

/**
 * Get total video count across all topics
 * @returns {number} Total number of videos
 */
export function getTotalVideoCount() {
  return getAllVideos().length;
}

/**
 * Get total duration of all videos in seconds
 * @returns {number} Total duration in seconds
 */
export function getTotalDuration() {
  return getAllVideos().reduce((sum, video) => sum + video.duration, 0);
}

/**
 * Get video statistics by topic
 * @param {string} topic - Topic name
 * @returns {Object} Statistics object
 */
export function getVideoStats(topic) {
  const videos = getVideosByTopic(topic);

  const stats = {
    total: videos.length,
    short: videos.filter(v => v.lengthCategory === "short").length,
    long: videos.filter(v => v.lengthCategory === "long").length,
    averageDuration: 0,
    totalDuration: 0
  };

  stats.totalDuration = videos.reduce((sum, v) => sum + v.duration, 0);
  stats.averageDuration = videos.length > 0 ? Math.round(stats.totalDuration / videos.length) : 0;

  return stats;
}

/**
 * Get all video statistics
 * @returns {Object} Statistics for all topics
 */
export function getAllVideoStats() {
  const allStats = {};
  for (const topic in videoPool) {
    allStats[topic] = getVideoStats(topic);
  }
  return allStats;
}
