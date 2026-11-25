import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ZUBRO — না বলা কথা ও জীবনের গল্প",
    short_name: "ZUBRO",
    description:
      "ZUBRO পেজের দীর্ঘ আখ্যান, জীবনমুখী গল্প ও অতিপ্রাকৃত রহস্যের ডিজিটাল গ্রন্থশালা।",
    start_url: "/",
    display: "standalone",
    background_color: "#F4EFE6",
    theme_color: "#191613",
    orientation: "portrait",
    icons: [
      {
        src: "/api/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
