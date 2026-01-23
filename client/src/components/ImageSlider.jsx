import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const ImageSlider = ({ images }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    fade: true,
  };

  if (!images || images.length === 0) return <p style={{textAlign:"center"}}>No images available</p>;

  return (
    <div style={{ margin: "20px 0", borderRadius: "10px", overflow: "hidden" }}>
      <Slider {...settings}>
        {images.map((img, index) => (
          <div key={index}>
            <img 
              src={img} 
              alt={`slide-${index}`} 
              style={{ width: "100%", height: "400px", objectFit: "cover" }} 
            />
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default ImageSlider;