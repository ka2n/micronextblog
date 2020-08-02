import { APIClient, Result } from "APIClient";
import { GetServerSideProps, NextPage } from "next";
import { OGPImage } from "server/ogp";

const ogp = () => null;

export default ogp;

type EntryQuery = {
  slug: string;
};

export const getServerSideProps: GetServerSideProps<any, EntryQuery> = async (
  ctx
) => {
  const res = ctx.res;
  // slugで取得してなければ探す
  if (!ctx.params?.slug) {
    res.writeHead(400).end();
    return {
      props: {},
    };
  }
  const [siteResult, entryResult] = await Promise.all([
    Result(APIClient.current.author()),
    Result(
      APIClient.current.findEntry(ctx.params.slug, {
        draftKey: ctx.previewData?.draftKey,
      })
    ),
  ]);
  const site = siteResult?.result?.data;
  const entry = entryResult?.result?.data;
  if (!site || !entry) {
    res.writeHead(400).end();
    return {
      props: {},
    };
  }

  const imageURL = await new Promise<string>((done) =>
    OGPImage({
      siteTitle: site.title,
      authorName: site.author_name,
      title: entry.title,
    }).toDataURL({
      mimeType: "image/png",
      callback: done,
    })
  );
  const decoder = require("image-data-uri");
  const decoded = decoder.decode(imageURL);

  res.setHeader("Content-Type", decoded.imageType);
  res.write(decoded.dataBuffer);
  res.end();

  return {
    props: {},
  };
};