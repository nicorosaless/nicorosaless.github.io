const asset = (path) => `${import.meta.env.BASE_URL}${path}`;
const logo = (file) => asset(`logos/${file}`);
const gh = (repo) => `https://github.com/${repo}`;

export const links = {
  github: "https://github.com/nicorosaless",
  linkedin: "https://www.linkedin.com/in/nicolas-rosales-gomez",
  email: "mailto:nirogo06@gmail.com",
  resume: asset(encodeURI("Nicolas Rosales Resume.pdf")),
};

// Newest first. Copy for the jobs follows LinkedIn.
export const jobs = [
  {
    date: "Jan 2027",
    upcoming: true,
    title: "Data Science Intern",
    org: "Mango",
    logos: [{ src: logo("mango.svg"), alt: "Mango" }],
    body: "Product Team.",
  },
  {
    date: "Apr – Oct 2026",
    title: "Software Engineer",
    org: "Quality Chemicals",
    logos: [{ src: logo("quality-chemicals.png"), alt: "Quality Chemicals", scale: 1.45 }],
    body: "Developed full-stack modules across quality management, document control, regulatory affairs, CRM and HR, from interfaces to backend services and data models. Integrated an AI agent that gives users business context, guides them through workflows and speeds up operational tasks.\n\nBuilt a production scheduling optimizer using CP-SAT that proposes plans minimizing late orders, total delay, changeovers and disruption to the current schedule.",
  },
  {
    date: "Jul – Sep 2025",
    title: "AI Engineer Intern",
    org: "Accenture",
    logos: [{ src: logo("accenture.svg"), alt: "Accenture" }],
    body: "Developed a system powered by AI agents that creates and updates knowledge graphs across multiple domains, with the goal of building an efficient GraphRAG system, using Neo4j as the graph framework and deploying on AWS.",
  },
  {
    date: "Jul – Sep 2024",
    title: "AI Engineer Intern",
    org: "Accenture",
    logos: [{ src: logo("accenture.svg"), alt: "Accenture" }],
    body: "Helped develop and ship an AI chatbot and generative assistant service on the OpenAI API and AWS. Did the prompt engineering and database changes that improved the experience and the accuracy of its answers.",
  },
];

// Newest first. All of these were wins: `result` says which prize; `body` says who ran it,
// what was asked and what we built, in one paragraph.
export const hackathons = [
  {
    date: "Oct 2026",
    title: "Respira Hackathon",
    result: "Winner · Early COPD challenge",
    logos: [
      { src: logo("hack/astrazeneca.svg"), alt: "AstraZeneca" },
      { src: logo("hack/ciberes.svg"), alt: "CIBERES" },
    ],
    body: "AstraZeneca and CIBERES, the Spanish respiratory research network, asked us to find COPD in chest CT before spirometry does, on 80 real patients whose data never left BSC's MareNostrum 5. Our project, MAPS, measures emphysema and the visible airway tree against what is expected for the same age, sex, height and smoking. It separates COPD from controls with an AUC of 0.91 on unseen patients, gives the same score on two scanner reconstructions (ICC 0.98, against 0.18 for the classic index) and flags 14 people as possible pre-COPD. I was invited to present it at the joint CIBERBBN and CIBERES scientific meeting in El Escorial on 20 November 2026.",
    links: {
      devpost: "https://devpost.com/software/maps-mapa-del-dano-pulmonar-en-la-epoc-precoz",
      github: gh("nicorosaless/respirahackathon2026"),
      blog: asset("maps/"),
    },
  },
  {
    date: "Nov 2025",
    title: "FME UPC Datathon",
    result: "Winner · Mango challenge",
    logos: [{ src: logo("mango.svg"), alt: "Mango" }],
    body: "At the datathon of UPC's Faculty of Mathematics and Statistics, Mango asked how many units of each garment to produce next season, from past collections and product images. We came first of 26 teams on the Kaggle leaderboard by putting the work into features rather than tuning: image embeddings compressed with PCA, aggregates by family and category, several seasons of history validated in time order, and two CatBoost models blended 60/40.",
    links: { github: gh("nicorosaless/Mango-DatathonFME25") },
  },
  {
    date: "Sep 2025",
    title: "AI Voice Hackathon",
    result: "Winner",
    logos: [{ src: logo("hack/murphy.svg"), alt: "Murphy" }],
    body: "Run by Enzo Ventures, Murphy and ElevenLabs in Barcelona. In one day we built a conversational agent on ElevenLabs that lets people practise talking with a client across different situations, shaped through prompt engineering, tool-calling definitions and hyperparameter choices.",
  },
  {
    date: "Feb 2025",
    title: "HackUDC",
    result: "Winner · Kelea challenge",
    logos: [
      { src: logo("hack/hackudc.svg"), alt: "HackUDC" },
      { src: logo("hack/kelea.png"), alt: "Kelea" },
    ],
    body: "At HackUDC, run by GPUL at the University of A Coruña, Kelea's prize went to the best LLM project on mental health. We built Sentikelia, an assistant that remembers you: a gpt-4o-mini chatbot that reads your diary (a photo of a paper page works too), Big Five and enneagram profiles from two BERT models, and a coach that breaks one goal into daily steps.",
    links: { devpost: "https://devpost.com/software/sentikelia", github: gh("derivada/sentikelia") },
  },
  {
    date: "Nov 2024",
    title: "HackEPS",
    result: "Winner · eCityclic AI challenge",
    logos: [
      { src: logo("hack/hackeps.png"), alt: "HackEPS" },
      { src: logo("hack/ecityclic.svg"), alt: "eCityclic" },
    ],
    body: "At HackEPS, run by LleidaHack, eCityclic wanted to suggest the next online procedure a citizen will need at their city council. In 24 hours we trained a transformer on past procedure sequences across 502 types at Lleida City Council. It returns the five likeliest next steps, drops any under 2% probability or out of season, and a Streamlit app on top let the jury try it.",
    links: {
      devpost: "https://devpost.com/software/ecityclic-porksinparis-submission-v2",
      github: gh("nicorosaless/ecityclic-recommender"),
    },
  },
];

// Interests: field → topic → thread. Each field is as wide as the threads under it.
// Leaves are what I am actually doing or have done; `href` only for public repos.
export const interests = [
  {
    id: "ml",
    label: "machine learning",
    children: [
      {
        label: "generative",
        children: [
          { label: "Flow matching in pixel space, no VAE", note: "pixel-flow · distilled to 1–4 steps" },
          { label: "Discrete diffusion language models", note: "minidllm · trained on Don Quijote" },
          { label: "Latent spaces you can walk", note: "SoleSpace · 2D VAE atlas", href: gh("nicorosaless/manifoldvisualizer") },
        ],
      },
      {
        label: "interp",
        children: [
          { label: "Sparse autoencoders on GPT-2", note: "TopK SAE · layer 6 MLP" },
          { label: "How features appear during pretraining", note: "pomelo-interp · crosscoders, induction heads" },
        ],
      },
      {
        label: "speech",
        children: [
          { label: "Catalan text-to-speech from scratch", note: "tts-ca · CALM on Mimi latents" },
          { label: "Turn-taking in voice agents", note: "veu-agent · p50 / p95 per stage" },
          { label: "Local speech-to-text on a Mac", note: "LocalWhisper · whisper.cpp, Qwen3-ASR", href: gh("nicorosaless/LocalWhisper") },
        ],
      },
      {
        label: "kernels",
        children: [
          { label: "FlashAttention forward and backward in Triton", note: "kernels · tested against PyTorch" },
          { label: "MoE and FP8 attention decode on H200", note: "Open Kernel Challenge · 1.68× SGLang", href: gh("nicorosaless/musespark-openchallenge") },
        ],
      },
    ],
  },
  {
    id: "data",
    label: "data",
    children: [
      {
        label: "imaging",
        children: [
          { label: "Lung damage before COPD", note: "MAPS · CT + spirometry", href: gh("nicorosaless/respirahackathon2026") },
          { label: "Fibrosis prognosis", note: "FibroPred" },
        ],
      },
      {
        label: "recsys",
        children: [
          { label: "Real-time ranking under 3 s", note: "Tinybird · Datathon FME 2026" },
          { label: "Next public procedure", note: "eCityclic · transformer", href: gh("nicorosaless/ecityclic-recommender") },
        ],
      },
      {
        label: "odd data",
        children: [
          { label: "Who has the ball, every frame", note: "LaLiga tracking · More than a Hack" },
          { label: "Molecules from mass spectra", note: "Kaggle · CASMI 2026" },
          { label: "Which LLM wrote this", note: "Kaggle · Name that LLM" },
        ],
      },
    ],
  },
  {
    id: "swe",
    label: "software",
    children: [
      {
        label: "agents",
        children: [
          { label: "Knowledge graphs that build themselves", note: "GraphRAG · Accenture" },
          { label: "Copilots with business context", note: "Kora · Quality Chemicals" },
          { label: "A personal assistant with a voice", note: "Hermes · MLX TTS", href: gh("nicorosaless/nicobot") },
        ],
      },
      {
        label: "local apps",
        children: [
          { label: "Prompt rewriting on a hotkey", note: "Promptlo · Swift + Ollama", href: gh("nicorosaless/Promptlo.app") },
          { label: "Private RAG and web search", note: "pomeloGPT", href: gh("nicorosaless/pomeloGPT") },
        ],
      },
      {
        label: "infra",
        children: [
          { label: "Jobs on MareNostrum 5", note: "Slurm · Singularity" },
          { label: "Experiment journals with predictions first", note: "every repo above" },
        ],
      },
    ],
  },
];
