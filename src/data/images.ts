const unsplash = (id: string, width: number, height: number) =>
  `https://images.unsplash.com/${id}?fit=crop&w=${width}&h=${height}&q=82&fm=png`;

export const heroPortrait = unsplash("photo-1500648767791-00dcc994a43e", 1200, 1600);

const marqueeImageIds = [
  "photo-1500530855697-b586d89ba3ee",
  "photo-1493246507139-91e8fad9978e",
  "photo-1511818966892-d7d671e672a2",
  "photo-1487958449943-2429e8be8625",
  "photo-1470770841072-f978cf4d019e",
  "photo-1501785888041-af3ef285b470",
  "photo-1494526585095-c41746248156",
  "photo-1484101403633-562f891dc89a",
  "photo-1518005020951-eccb494ad742",
  "photo-1449157291145-7efd050a4d0e",
  "photo-1497366754035-f200968a6e72",
  "photo-1497366811353-6870744d04b2",
  "photo-1497366216548-37526070297c",
  "photo-1524758631624-e2822e304c36",
  "photo-1494438639946-1ebd1d20bf85",
  "photo-1505693416388-ac5ce068fe85",
  "photo-1488590528505-98d2b5aba04b",
  "photo-1518770660439-4636190af475",
  "photo-1550745165-9bc0b252726f",
  "photo-1531297484001-80022131f5a1",
  "photo-1483058712412-4245e9b90334",
];

export const marqueeImages = marqueeImageIds.map((id) => unsplash(id, 840, 540));

export type Project = {
  number: string;
  name: string;
  col1: [string, string];
  col2: string;
};

export const projects: Project[] = [
  {
    number: "01",
    name: "Project 01",
    col1: [
      unsplash("photo-1497366216548-37526070297c", 900, 700),
      unsplash("photo-1497366754035-f200968a6e72", 900, 700),
    ],
    col2: unsplash("photo-1497366811353-6870744d04b2", 1200, 1400),
  },
  {
    number: "02",
    name: "Project 02",
    col1: [
      unsplash("photo-1518770660439-4636190af475", 900, 700),
      unsplash("photo-1531297484001-80022131f5a1", 900, 700),
    ],
    col2: unsplash("photo-1488590528505-98d2b5aba04b", 1200, 1400),
  },
  {
    number: "03",
    name: "Project 03",
    col1: [
      unsplash("photo-1487958449943-2429e8be8625", 900, 700),
      unsplash("photo-1518005020951-eccb494ad742", 900, 700),
    ],
    col2: unsplash("photo-1449157291145-7efd050a4d0e", 1200, 1400),
  },
  {
    number: "04",
    name: "Project 04",
    col1: [
      unsplash("photo-1501785888041-af3ef285b470", 900, 700),
      unsplash("photo-1470770841072-f978cf4d019e", 900, 700),
    ],
    col2: unsplash("photo-1500530855697-b586d89ba3ee", 1200, 1400),
  },
];

