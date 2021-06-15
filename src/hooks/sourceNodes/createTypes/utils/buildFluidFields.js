const getSizeAfterTransformations = require('./getSizeAfterTransformations');
const createUrl = require('./createUrl');
const objectAssign = require('object-assign');

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
      },
      forceBlurhash: 'Boolean',
    },
    resolve: (
      node,
      { forceBlurhash, maxWidth, maxHeight, imgixParams = {}, sizes, resizes },
    ) => {
      const image = node.entityPayload.attributes;

      if (!image.is_image || image.format === 'svg') {
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

          if (!imgixParams.w && !imgixParams.h) {
            extraParams.w = finalWidth;
          }

          const url = createUrl(
            image.url,
            objectAssign({}, imgixParams, extraParams),
            { autoFormat: true, focalPoint: node.focalPoint },
          );

          return `${url} ${Math.round(screen)}w`;
        })
        .join(`,\n`);

      return {
        aspectRatio,
        src: createUrl(image.url, imgixParams, {
          autoFormat: true,
          focalPoint: node.focalPoint,
        }),
        width: finalWidth,
        height: finalHeight,
        format: image.format,
        srcSet,
        sizes: realSizes,
        forceBlurhash,
      };
    },
  };

  return {
    fluid: field,
    sizes: field,
  };
};
