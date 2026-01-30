import { prisma } from "../../src/lib/prisma";

async function main() {
  const samplePack = await prisma.prepPack.create({
    data: {
      title: "Seed Test: Startup X & Investor Y",
      startupName: "TechFlow AI",
      investorName: "Blue Chip Ventures",
      startupProfileText: "A B2B SaaS for workflow automation...",
      investorProfileText: "Early stage investor focused on AI and productivity...",
      resultJson: {
        summary: ["Founded in 2024", "300% YoY growth"],
        fitScore: 85,
        questions: ["What is your CAC?", "How do you handle churn?"],
        agenda: { "0-2": "Intros", "2-7": "Product Demo" }
      },
      model: "gpt-4o"
    },
  });

  console.log('✅ Created sample prep pack:', samplePack.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });