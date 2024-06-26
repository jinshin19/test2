import Footer from "../components/Footer";
import Nav from "../components/Nav";
import ReadComponent from "../components/ReadComponent";
import { Params, useParams } from "react-router-dom";
import { useGetDevByIDQuery } from "../services/queries";

const Read = () => {
  const { id }: Params = useParams();
  const { data } = useGetDevByIDQuery(id!);
  return (
    <div className="wrapper read-wrapper">
      <Nav />
      <ReadComponent {...data?.data} />
      <Footer />
    </div>
  );
};

export default Read;
