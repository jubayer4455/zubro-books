import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          backgroundColor: "#F4EFE6",
          color: "#191613",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Bookbinder Cloth Spine */}
        <div
          style={{
            width: "34px",
            height: "630px",
            backgroundColor: "#7D231B",
            display: "flex",
          }}
        />

        {/* Editorial Double-Rule Print Sheet */}
        <div
          style={{
            flex: 1,
            margin: "36px 44px 36px 36px",
            border: "2px solid #2B2520",
            padding: "10px",
            display: "flex",
          }}
        >
          <div
            style={{
              flex: 1,
              border: "1px solid #C8BDA9",
              backgroundColor: "#FAF7F0",
              padding: "46px 64px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #D6CCBC",
                paddingBottom: "18px",
                fontSize: "18px",
                letterSpacing: "4px",
                color: "#7D231B",
                textTransform: "uppercase",
              }}
            >
              <span>ZUBRO DIGITAL LITERARY HOUSE</span>
              <span style={{ color: "#6E655A" }}>DHAKA · EDITION</span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "18px",
              }}
            >
              <div
                style={{
                  fontSize: "92px",
                  fontWeight: 700,
                  letterSpacing: "22px",
                  color: "#191613",
                  lineHeight: 1.05,
                }}
              >
                ZUBRO
              </div>
              <div
                style={{
                  width: "96px",
                  height: "3px",
                  backgroundColor: "#7D231B",
                  display: "flex",
                }}
              />
              <div
                style={{
                  fontSize: "26px",
                  color: "#4E473F",
                  letterSpacing: "2px",
                  maxWidth: "820px",
                  lineHeight: 1.5,
                }}
              >
                Unspoken Stories, Slow-Burn Mysteries, Midnight Horror & Serialized Bengali Novels
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #D6CCBC",
                paddingTop: "18px",
                fontSize: "17px",
                letterSpacing: "3px",
                color: "#6E655A",
              }}
            >
              <span>PRINT-EDITION READER</span>
              <span style={{ color: "#191613", fontWeight: 600 }}>
                zubrobooks.vercel.app
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
