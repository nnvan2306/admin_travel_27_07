import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "antd";

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="w-screen h-screen flex flex-col justify-center items-center">
      <DotLottieReact
        src="https://lottie.host/02d35e4e-8806-496d-a6ef-e21826af4397/cyyyt48KdX.lottie"
        loop
        autoplay
        className="lg:w-[1200px]"
      />
      <Button onClick={() => navigate('/')}>Quay về trang chủ</Button>
    </div>
  )
}
