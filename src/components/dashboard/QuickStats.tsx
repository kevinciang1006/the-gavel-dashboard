import { motion } from "framer-motion";
import { Gavel, TrendingUp, DollarSign, Percent } from "lucide-react";

const stats = [
  { label: "Total Auctions", value: "12", icon: Gavel, accent: "text-primary" },
  { label: "Active Loans", value: "8", icon: TrendingUp, accent: "text-accent" },
  { label: "Total Volume", value: "$1.2M", icon: DollarSign, accent: "text-success" },
  { label: "Avg Interest Rate", value: "9.5%", icon: Percent, accent: "text-warning" },
];

const QuickStats = () => {
  return (
    <section className="py-8">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <stat.icon className={`h-4 w-4 ${stat.accent}`} />
              </div>
              <p className="text-3xl font-bold font-mono-numbers animate-count-up">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickStats;