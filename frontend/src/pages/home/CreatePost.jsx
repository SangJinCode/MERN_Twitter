import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";

const CreatePost = () => {
  const [text, setText] = useState("");
  const [img, setImg] = useState(null);

  //useRef는 컴포넌트가 렌더링 되어도 값이 유지된다.
  const imgRef = useRef(null);

  const isPending = false;
  const isError = false;

  const data = {
    profileImg: "/avatars/boy1.png",
  };

  //e.preventDefault는 <a>나 submit 같은 이벤트 발생시 이벤트는 실행되지만 새로고침은 방지
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Post created successfully");
  };

  //input으로 입력된 파일은 배열 형태로 전달되고 이 배열에 접근하기 위해 e.target.files[0] 사용
  //FileReader()은 file 또는 blob 객체를 이용해 파일을 읽고 컴퓨터에 저장
  //onload는 파일 읽기가 성공적으로 완료되었을때 실행되고 setImg()에 reader.result를 업데이트 한다.
  //readAsDataURL(file)은 file의 URL을 반환
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImg(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="flex p-4 items-start gap-4 border-b border-gray-700">
      <div className="avatar">
        <div className="w-8 rounded-full"> 
          <img src={data.profileImg || "/avatar-placeholder.png"} />
        </div>
      </div>
      <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
        <textarea 
          className="textarea w-full p-0 text-lg resize-none border-none focus:outline-none border-gray-800"
          placeholder="What is happening?!"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        {/* img가 true이면 IoCloseSharp를 클릭시 setImg()와 imgRef.current.value를 null로 설정 */}
        {img && (
          <div className="relative w-72 mx-auto">
            <IoCloseSharp 
              className="absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer"
              onClick={() => {
                setImg(null)
                imgRef.current.value = null
              }}
            />
            <img src={img} className="w-full mx-auto h-72 object-contain rounded" />
          </div>
        )}

        <div className="flex justify-between border-t py-2 border-t-gray-700">
          <div className="flex gap-1 items-center">
          {/* imgRef.current.click()가 실행되면 ref={imgRef}가 정의된 input 태그가 실행되고 handleImgChange()를 호출한다. */}
            <CiImageOn 
              className="fill-primary w-6  h-6 cursor-point"
              onClick={() => imgRef.current.click()}
            />
            <BsEmojiSmileFill className="fill-primary w-5 h-5 cursor-pointer"/>
          </div>
          {/* hidden을 사용하면 추가된 파일명이 표시되는 것을 방지한다. */}
          <input type='file' hidden ref={imgRef} onChange={handleImgChange}/>
          <button className="btn btn-primary rounded-full btn-sm text-white px-4">
            {isPending ? "Posting..." : "Post"}
          </button>
        </div>
        {isError && <div className="text-red-500">Something went wrong</div>}
      </form>
    </div>
  )
};

export default CreatePost;