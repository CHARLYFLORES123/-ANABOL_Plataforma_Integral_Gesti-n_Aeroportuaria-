import React, { useState } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import {
  Col,
  Row,
  DropdownToggle,
  DropdownMenu,
  DropdownItem, Dropdown,
} from "reactstrap";
import Widget from "../../components/Widget/Widget";
import s from "./Profile.module.scss";

import moreIcon from "../../assets/tables/moreIcon.svg";
import profileImg from "../../assets/profile/profile.png";

function Profile(props) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const { currentUser } = props;

  const profileMenuOpen = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
  }

  // Obtener la URL del avatar desde el array que devuelve Django
  const userAvatar = (currentUser?.avatar && currentUser.avatar.length > 0) 
    ? currentUser.avatar[0].url 
    : profileImg;

  return(
    <div>
      <Row className="mb-4">
        <Col xs={12}>
          <Widget className={`widget-p-md ${s.profile}`}>
            <div className="d-flex justify-content-end">
              <Dropdown
                nav
                isOpen={profileDropdownOpen}
                toggle={() => profileMenuOpen()}
              >
                <DropdownToggle nav className="p-0">
                  <img src={moreIcon} alt="More..."/>
                </DropdownToggle>
                <DropdownMenu >
                  <DropdownItem onClick={() => props.history.push('/template/edit_profile')}>Edit</DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
            <div className={s.profileTitle}>
              <img className="mx-0 mx-md-2" src={userAvatar} alt="..." style={{ width: '280px', height: '280px', borderRadius: '50%', objectFit: 'cover' }}/>
              <div className="d-flex flex-column mb-2 ml-3">
                <p className="headline-1">{currentUser?.firstName} {currentUser?.lastName}</p>
                <p className="headline-2 mt-1 mb-4">{currentUser?.role || 'User'}</p>
                <p className="body-1 mb-2">
                  <span className="fw-semi-bold">Email:</span> {currentUser?.email || 'N/A'}
                </p>
                <p className="body-1 mb-3">
                  <span className="fw-semi-bold">Teléfono:</span> {currentUser?.phoneNumber || 'Not provided'}
                </p>
                <hr />
              </div>
            </div>

          </Widget>
        </Col>
      </Row>
    </div>
  )
}

function mapStateToProps(state) {
  return {
    currentUser: state.auth.currentUser,
  };
}

export default withRouter(connect(mapStateToProps)(Profile));
