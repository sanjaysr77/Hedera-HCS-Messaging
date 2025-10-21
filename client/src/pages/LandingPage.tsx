import { motion } from "framer-motion";
import { FaGithub, FaLinkedin, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full relative bg-white overflow-hidden flex flex-col items-center justify-start px-6">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at top right, rgba(56, 193, 182, 0.5), transparent 70%)`,
          filter: "blur(100px)",
          backgroundRepeat: "no-repeat",
        }}
      />

      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at bottom left, rgba(128, 90, 230, 0.3), transparent 70%)`,
          filter: "blur(120px)",
          backgroundRepeat: "no-repeat",
        }}
      />

      <motion.div
        className="absolute top-6 right-6 flex space-x-4 z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
      >
        <a
          href="https://github.com/sanjaysr77/Hedera-HCS-Messaging"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-gray-900 transition-colors duration-300 text-xl md:text-2xl"
          title="GitHub"
        >
          <FaGithub />
        </a>
        <a
          href="https://www.linkedin.com/in/sanjaysr77/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-900 transition-colors duration-300 text-xl md:text-2xl"
          title="LinkedIn"
        >
          <FaLinkedin />
        </a>
        <a
          href="https://docs.hedera.com/hedera/tutorials/consensus/submit-your-first-message"
          target="_blank"
          rel="noopener noreferrer"
          className="text-teal-500 hover:text-teal-700 transition-colors duration-300 text-xl md:text-2xl"
          title="Hedera Resources"
        >
          <FaBook />
        </a>
      </motion.div>

      <motion.div
        className="relative z-10 text-center mt-20 mb-10 px-4"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 drop-shadow-lg">
          Hedera Messaging Hub
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
          Explore the <span className="font-semibold text-teal-500">Hedera Consensus Service (HCS)</span> to send, encrypt, and retrieve messages on the Hedera network.
        </p>
      </motion.div>

      <motion.div
        className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 mb-16 hover:scale-105 transform transition duration-500 ease-in-out"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <h2 className="text-3xl font-bold text-teal-600 mb-6 text-center">
          Features
        </h2>
        <ul className="list-disc pl-5 space-y-3 text-gray-700 text-lg">
          <li>Message Encryption: Secure messages before sending.</li>
          <li>Message Filtering: Filter messages by keywords.</li>
          <li>Real-time HCS updates with topic subscription.</li>
          <li>Powered by <span className="font-semibold text-teal-500">Hedera SDK</span> for HCS integration.</li>
          <li>Built with <span className="font-semibold text-teal-500">React, Express and TypeScript.</span></li>
        </ul>
      </motion.div>

      <motion.div
        className="relative z-10 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <button
          onClick={() => navigate("/messaging")}
          className="bg-teal-500 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition duration-200 ease-in-out
            hover:bg-teal-700 active:scale-95 cursor-pointer text-lg md:text-xl"
        >
          Get Started
        </button>
      </motion.div>
    </div>
  );
}

export default LandingPage;
