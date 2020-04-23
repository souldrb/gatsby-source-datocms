const isImage = require('./isImage');
const getSizeAfterTransformations = require('./getSizeAfterTransformations');
const createUrl = require('./createUrl');

module.exports = () => {
  const field = {
    type: 'DatoCmsFluid',
    args: {
      maxWidth: {
        type: 'Int',
        defaultValue: 800,
      },
      maxHeight: 'Int',
      sizes: 'String',
      imgixParams: 'DatoCmsImgixParams',
      resizes: {
        type: '[Int]',
        defaultValue: [375, 1024, 1440, 2560]
      }
    },
    resolve: (image, { maxWidth, maxHeight, imgixParams = {}, sizes, resizes }) => {
      if (!isImage(image)) {
        return null;
      }

      const {
        width: finalWidth,
        height: finalHeight,
      } = getSizeAfterTransformations(image.width, image.height, imgixParams);

      const aspectRatio = finalWidth / finalHeight;

      const realMaxWidth = maxHeight ? maxHeight * aspectRatio : maxWidth;

      const realSizes =
        sizes || `(max-width: ${realMaxWidth}px) 100vw, ${realMaxWidth}px`;

      const srcSet = resizes
        .filter(screen => screen < finalWidth)
        .concat([finalWidth])
        .map(screen => {
          let extraParams = {
            dpr: 1,
            w: screen
          };
          const url = createUrl(image, imgixParams, extraParams, true);

          return `${url} ${Math.round(screen)}w`;
        })
        .join(`,\n`);

      return {
        aspectRatio,
        src: createUrl(image, imgixParams, {}, true),
        width: finalWidth,
        height: finalHeight,
        format: image.format,
        srcSet,
        sizes: realSizes,
      };
    },
  };

  return {
    fluid: field,
    sizes: field,
  };
};

