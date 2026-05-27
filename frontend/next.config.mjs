/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["react-markdown", "remark-gfm", "remark-parse", "unified", "bail", "is-plain-obj", "trough", "vfile", "vfile-message", "unist-util-stringify-position", "mdast-util-from-markdown", "mdast-util-to-hast", "mdast-util-gfm", "micromark", "micromark-extension-gfm", "decode-named-character-reference", "devlop", "hast-util-to-jsx-runtime", "hast-util-whitespace", "property-information", "space-separated-tokens", "comma-separated-tokens", "estree-util-is-identifier-name", "html-url-attributes", "zwitch", "unist-util-visit", "unist-util-visit-parents", "unist-util-is", "mdast-util-to-string", "trim-lines"],
};

export default nextConfig;
