export function calculateUciPoints(scaleCode: string, rank: number): number {
  if (rank <= 0) return 0;

  switch (scaleCode) {
    case "WT_MONUMENT": {
      const monumentTable: Record<number, number> = {
        1: 800,
        2: 640,
        3: 520,
        4: 440,
        5: 360,
        6: 280,
        7: 240,
        8: 200,
        9: 160,
        10: 135,
        11: 110,
        12: 95,
        13: 85,
        14: 65,
        15: 55,
      };
      if (monumentTable[rank]) return monumentTable[rank];
      if (rank <= 20) return 50;
      if (rank <= 30) return 30;
      if (rank <= 50) return 15;
      if (rank <= 60) return 10;
      return 0;
    }

    case "WT_1DAY": {
      const oneDayTable: Record<number, number> = {
        1: 400,
        2: 320,
        3: 260,
        4: 220,
        5: 180,
        6: 140,
        7: 120,
        8: 100,
        9: 80,
        10: 68,
        11: 56,
        12: 48,
        13: 40,
        14: 32,
        15: 28,
      };
      if (oneDayTable[rank]) return oneDayTable[rank];
      if (rank <= 20) return 24;
      if (rank <= 30) return 16;
      if (rank <= 50) return 8;
      return 0;
    }

    case "WT_TDF": {
      const tdfTable: Record<number, number> = {
        1: 1300,
        2: 1040,
        3: 880,
        4: 750,
        5: 620,
        6: 520,
        7: 425,
        8: 360,
        9: 295,
        10: 230,
        11: 190,
        12: 165,
        13: 140,
        14: 110,
        15: 100,
      };
      if (tdfTable[rank]) return tdfTable[rank];
      if (rank <= 20) return 80;
      if (rank <= 30) return 50;
      if (rank <= 50) return 25;
      return 0;
    }

    case "WT_GRAND_TOUR": {
      const gtTable: Record<number, number> = {
        1: 1100,
        2: 885,
        3: 750,
        4: 600,
        5: 495,
        6: 415,
        7: 340,
        8: 285,
        9: 235,
        10: 180,
        11: 155,
        12: 130,
        13: 110,
        14: 90,
        15: 80,
      };
      if (gtTable[rank]) return gtTable[rank];
      if (rank <= 20) return 60;
      if (rank <= 30) return 40;
      if (rank <= 50) return 20;
      return 0;
    }

    default:
      return Math.max(0, 100 - rank * 5);
  }
}
