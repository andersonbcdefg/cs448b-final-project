const htmlmin = require("html-minifier");
var CleanCSS = require("clean-css");
const cssmin = new CleanCSS({level: 2});

module.exports = function(eleventyConfig) {
    // Minify HTML
    eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
        if (outputPath.endsWith(".html")) {
            let minified = htmlmin.minify(content, {
                useShortDoctype: true,
                removeComments: true,
                collapseWhitespace: true
            });
            return minified;
        }

        return content;
    });

    // Minify CSS
    eleventyConfig.addTransform("cssmin", function(content, outputPath) {
        if (outputPath.endsWith(".css")) {
            let minified = cssmin.minify(content).styles;
            return minified;
        }

        return content;
    });

    // Passthrough copy for data, js, and css folders
    eleventyConfig.addPassthroughCopy("src/data");
    eleventyConfig.addPassthroughCopy("src/js");
    eleventyConfig.addPassthroughCopy("src/styles");
    eleventyConfig.addPassthroughCopy("src/img");

    // You can return your Config object (optional).
    return {
        dir: {
            input: "src",
            output: "dist"
        },
        templateFormats: ["njk"]
    };
};

